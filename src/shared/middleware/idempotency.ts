import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { prisma } from '../database/index';
import { logger } from '../observability/logger';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Idempotency for write operations. Clients send "Idempotency-Key"; the first
 * request is executed and its response stored; replays with the same key
 * (and same user/method/path) return the stored response atomically.
 */
export const idempotency = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!WRITE_METHODS.has(req.method)) {
    next();
    return;
  }

  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
  if (!idempotencyKey || idempotencyKey.length > 255) {
    next();
    return;
  }

  const userId = (req as any).user?.id as string | undefined;
  // Idempotency requires an authenticated caller so the key scope is unambiguous.
  if (!userId) {
    next();
    return;
  }
  const path = `${req.baseUrl}${req.route?.path || req.path}`;
  const requestHash = createHash('sha256')
    .update(JSON.stringify(req.body ?? {}))
    .digest('hex');

  let recordId: string | undefined;

  try {
    // Atomic insert — the unique constraint on (key, userId, method, path)
    // resolves races between concurrent replays.
    const record = await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        userId,
        method: req.method,
        path,
        requestHash,
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
      },
    });
    recordId = record.id;
  } catch (uniqueError: any) {
    if (uniqueError?.code !== 'P2002') {
      // Idempotency store unavailable — fail open rather than block traffic.
      logger.error({ err: uniqueError }, 'Idempotency store error, proceeding without guarantee');
      next();
      return;
    }

    const existing = await prisma.idempotencyKey.findUnique({
      where: { key_userId_method_path: { key: idempotencyKey, userId: userId ?? '', method: req.method, path } },
    });

    if (!existing) {
      res.status(503).json({ error: 'Idempotency record is being processed, retry shortly' });
      return;
    }

    if (existing.requestHash !== requestHash) {
      res.status(422).json({ error: 'Idempotency-Key reused with a different request body' });
      return;
    }

    if (existing.responseBody !== null && existing.responseCode !== null) {
      res.status(existing.responseCode).json(existing.responseBody as any);
      return;
    }

    // Original request still in flight
    res.status(409).json({ error: 'Duplicate request already in progress' });
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    if (recordId) {
      prisma.idempotencyKey
        .update({
          where: { id: recordId },
          data: { responseCode: res.statusCode, responseBody: body ?? null },
        })
        .catch((err: unknown) => logger.error({ err }, 'Failed to store idempotent response'));
    }
    return originalJson(body);
  } as typeof res.json;

  next();
};
