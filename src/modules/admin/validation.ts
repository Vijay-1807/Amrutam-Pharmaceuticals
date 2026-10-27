import { z } from 'zod';

export const analyticsSchema = z.object({
  query: z.object({
    period: z.enum(['day', 'week', 'month']).default('month'),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    role: z.enum(['PATIENT', 'DOCTOR', 'ADMIN']).optional(),
    page: z.string().transform(val => parseInt(val, 10)).default('1'),
    limit: z.string().transform(val => parseInt(val, 10)).default('10'),
  }),
});
