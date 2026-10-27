import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      },
  base: {
    service: 'telemedicine-backend',
    env: process.env.NODE_ENV,
  },
  redact: [
    'req.headers.authorization',
    'res.headers.authorization',
    'password',
    'currentPassword',
    'newPassword',
    'mfaSecret',
    'token',
    '*.password',
    '*.mfaSecret',
  ],
});

export class AuditLogger {
  static async log({
    userId,
    action,
    resourceType,
    resourceId,
    oldValues,
    newValues,
    ipAddress,
    userAgent,
  }: {
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    logger.info({
      userId,
      action,
      resourceType,
      resourceId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
    }, 'Audit log entry');

    // Persist to audit_logs table; a DB hiccup must never break the request flow.
    try {
      const { prisma } = await import('../database/index');
      await prisma.auditLog.create({
        data: {
          userId: userId ?? null,
          action,
          resourceType,
          resourceId: resourceId ?? null,
          oldValues: oldValues ?? undefined,
          newValues: newValues ?? undefined,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
        },
      });
    } catch (err) {
      logger.error({ err, action }, 'Failed to persist audit log');
    }
  }
}