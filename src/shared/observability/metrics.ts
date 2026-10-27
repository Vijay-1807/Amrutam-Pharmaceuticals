import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

// HTTP metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register],
});

// Business metrics
export const consultationsTotal = new Counter({
  name: 'consultations_total',
  help: 'Total number of consultations',
  labelNames: ['status'],
  registers: [register],
});

export const consultationsActive = new Gauge({
  name: 'consultations_active',
  help: 'Number of active consultations',
  registers: [register],
});

export const bookingsTotal = new Counter({
  name: 'bookings_total',
  help: 'Total number of bookings',
  labelNames: ['type'],
  registers: [register],
});

// Error metrics
export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'route'],
  registers: [register],
});

export const metricsContentType = register.contentType;

export async function getMetrics(): Promise<string> {
  return register.metrics();
}