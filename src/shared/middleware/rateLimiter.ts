import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import { config } from '../../config/index';
import { logger } from '../observability/logger';

let redis: Redis | null = null;
let redisAvailable = true;
let lastAvailabilityProbe = 0;
const PROBE_COOLDOWN_MS = 30_000;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
    });
    redis.on('error', (err: Error) => logger.warn({ err: err.message }, 'Redis error'));
  }
  return redis;
}

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Fixed-window counter keyed by client identifier (user id when authenticated).
  const client = getRedis();

  if (!redisAvailable) {
    // Periodically re-probe Redis after a failure so limiting resumes automatically.
    if (Date.now() - lastAvailabilityProbe < PROBE_COOLDOWN_MS) {
      next();
      return;
    }
    lastAvailabilityProbe = Date.now();
  }

  try {
    if (client.status === 'wait' || client.status === 'close') {
      await client.connect();
    }
    redisAvailable = true;

    const user = (req as any).user;
    const identifier = user?.id || req.ip || 'unknown';
    const key = `rate_limit:${identifier}`;
    const windowMs = config.RATE_LIMIT_WINDOW_MS;
    const maxRequests = config.RATE_LIMIT_MAX_REQUESTS;

    const current = await client.incr(key);
    if (current === 1) {
      await client.pexpire(key, windowMs);
    }

    const ttl = await client.pttl(key);
    const remaining = Math.max(0, maxRequests - current);

    res.set({
      'X-RateLimit-Limit': String(maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.max(0, Math.ceil(ttl / 1000))),
    });

    if (current > maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.max(1, Math.ceil(ttl / 1000)),
      });
      return;
    }

    next();
  } catch {
    // Redis unavailable — fail open, but remember to back off from probing.
    redisAvailable = false;
    lastAvailabilityProbe = Date.now();
    next();
  }
};

export async function closeRateLimiter(): Promise<void> {
  if (redis) {
    try {
      redis.disconnect();
    } catch {}
    redis = null;
  }
}
