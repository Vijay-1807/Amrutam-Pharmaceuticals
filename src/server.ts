import { app } from './app';
import { config } from './config/index';
import { logger } from './shared/observability/logger';
import { closeRateLimiter } from './shared/middleware/rateLimiter';
import { emailQueue, notificationQueue, reminderQueue } from './shared/jobs/queue';

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Telemedicine backend started');
});

// Graceful shutdown: stop accepting connections, drain queues, close DB/Redis.
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal');
  server.close(async () => {
    try {
      await Promise.allSettled([
        emailQueue.close(),
        notificationQueue.close(),
        reminderQueue.close(),
        closeRateLimiter(),
      ]);
      const { prisma } = await import('./shared/database/index');
      await prisma.$disconnect();
    } catch {}
    logger.info('Server closed');
    process.exit(0);
  });
  // Force-exit if graceful shutdown hangs
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

export { server };
