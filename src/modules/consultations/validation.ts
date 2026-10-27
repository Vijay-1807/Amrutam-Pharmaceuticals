import { z } from 'zod';

const STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;

export const bookConsultationSchema = z.object({
  body: z.object({
    doctorId: z.string().uuid('Invalid doctor ID'),
    slotId: z.string().uuid('Invalid slot ID').optional(),
    type: z.enum(['VIDEO', 'PHONE', 'CHAT', 'IN_PERSON']).default('VIDEO'),
    symptoms: z.string().max(5000).optional(),
  }),
});

export const updateConsultationSchema = z.object({
  body: z
    .object({
      status: z.enum(STATUSES).optional(),
      diagnosis: z.string().max(10000).optional(),
      notes: z.string().max(10000).optional(),
      symptoms: z.string().max(5000).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' }),
});

export const listConsultationsSchema = z.object({
  query: z.object({
    status: z.enum(STATUSES).optional(),
    doctorId: z.string().uuid().optional(),
    patientId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
});
