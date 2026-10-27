import { z } from 'zod';

export const createPrescriptionSchema = z.object({
  body: z.object({
    consultationId: z.string().uuid('Invalid consultation ID'),
    medication: z.string().min(1, 'Medication is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    frequency: z.string().min(1, 'Frequency is required'),
    duration: z.string().min(1, 'Duration is required'),
    instructions: z.string().optional(),
  }),
});

export const listPrescriptionsSchema = z.object({
  query: z.object({
    consultationId: z.string().uuid().optional(),
    page: z.string().transform(val => parseInt(val, 10)).default('1'),
    limit: z.string().transform(val => parseInt(val, 10)).default('10'),
  }),
});
