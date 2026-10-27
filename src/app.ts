import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index';
import { errorHandler, asyncHandler } from './shared/middleware/errorHandler';
import { authenticate } from './shared/middleware/auth';
import { rateLimiter } from './shared/middleware/rateLimiter';
import { idempotency } from './shared/middleware/idempotency';
import { logger } from './shared/observability/logger';
import { httpRequestsTotal, httpRequestDuration, getMetrics, register } from './shared/observability/metrics';
import { getTraceId, setTraceHeaders } from './shared/observability/tracing';
import authRoutes from './modules/auth/routes';
import doctorRoutes from './modules/doctors/routes';
import consultationRoutes from './modules/consultations/routes';
import prescriptionRoutes from './modules/prescriptions/routes';
import paymentRoutes from './modules/payments/routes';
import adminRoutes from './modules/admin/routes';

import path from 'path';
import fs from 'fs';

export const app = express();

// Trust proxy (e.g. behind a load balancer)
app.set('trust proxy', 1);

// Security headers (CSP relaxed for interactive UI / Swagger)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// Serve static frontend assets
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));
app.use('/public', express.static(publicPath));

// CORS
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Trace id middleware
app.use((req, res, next) => {
  const traceId = getTraceId(req);
  setTraceHeaders(res, traceId);
  (req as any).id = traceId;
  next();
});

// Request logging + Prometheus metrics
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
    const route = `${req.baseUrl}${req.route?.path || ''}` || req.path;
    httpRequestsTotal.inc({ method: req.method, route, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, route }, durationSec);
    logger.info(
      {
        method: req.method,
        path: req.path,
        route,
        statusCode: res.statusCode,
        durationMs: Math.round(durationSec * 1000),
        traceId: (req as any).id,
        ip: req.ip,
        userId: (req as any).user?.id,
      },
      'request completed',
    );
  });
  next();
});

// Rate limiting (skip metrics/health endpoints)
app.use('/api', rateLimiter);

// Health check (liveness)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'telemedicine-backend', timestamp: new Date().toISOString() });
});

// Readiness check (DB + Redis)
app.get('/ready', asyncHandler(async (_req, res) => {
  const { prisma } = await import('./shared/database/index');
  const checks: Record<string, string> = { database: 'ok', redis: 'skipped' };
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return res.status(503).json({ status: 'not ready', checks: { ...checks, database: 'down' } });
  }
  res.json({ status: 'ready', checks });
}));

// Metrics endpoint (Prometheus)
app.get('/metrics', asyncHandler(async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await getMetrics());
}));

// API routes (idempotency runs after each module's authenticate middleware)
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// OpenAPI schema route
app.get('/api/openapi.json', (_req, res) => {
  const specPath = path.join(__dirname, '../docs/openapi.json');
  if (fs.existsSync(specPath)) {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(specPath);
  } else {
    res.status(404).json({ error: 'OpenAPI specification not found' });
  }
});

// Documentation & Portal Web UI routes
app.get(['/docs', '/portal'], (_req, res) => {
  const indexPath = path.join(__dirname, '../public/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Amrutam Telemedicine API Running');
  }
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler (must be last)
app.use(errorHandler);
