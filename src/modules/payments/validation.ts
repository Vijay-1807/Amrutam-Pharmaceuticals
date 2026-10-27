import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    consultationId: z.string().uuid('Invalid consultation ID'),
  }),
});

export const updatePaymentStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']),
    transactionId: z.string().optional(),
  }),
});

export const listPaymentsSchema = z.object({
  query: z.object({
    consultationId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
    page: z.string().transform(val => parseInt(val, 10)).default('1'),
    limit: z.string().transform(val => parseInt(val, 10)).default('10'),
  }),
});
