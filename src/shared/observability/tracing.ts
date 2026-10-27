import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

export function generateTraceId(): string {
  return randomUUID();
}

export function getTraceId(req: Request): string {
  const incoming = req.headers['x-trace-id'] || req.headers['x-request-id'];
  return typeof incoming === 'string' && incoming.length <= 64 ? incoming : generateTraceId();
}

export function setTraceHeaders(res: Response, traceId: string): void {
  res.set('X-Trace-Id', traceId);
  res.set('X-Request-Id', traceId);
}
