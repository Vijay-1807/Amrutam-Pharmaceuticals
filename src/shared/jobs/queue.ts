import Queue from 'bull';

export interface JobData {
  type: 'email' | 'sms' | 'notification' | 'report' | 'reminder';
  [key: string]: any;
}

export const emailQueue = new Queue<JobData>('email-notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const notificationQueue = new Queue<JobData>('notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const reminderQueue = new Queue<JobData>('appointment-reminders', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await emailQueue.close();
  await notificationQueue.close();
  await reminderQueue.close();
  process.exit(0);
});