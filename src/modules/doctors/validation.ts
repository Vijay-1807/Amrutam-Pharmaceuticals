import { z } from 'zod';

export const createDoctorSchema = z.object({
  body: z.object({
    licenseNumber: z.string().min(1, 'License number is required').max(100),
    specialty: z.string().min(1, 'Specialty is required').max(100),
    experienceYears: z.number().int().nonnegative().max(70, 'Experience years unrealistic'),
    consultationFee: z.number().nonnegative().max(1000000),
    bio: z.string().max(5000).optional(),
    education: z.string().max(5000).optional(),
    languages: z.array(z.string().max(50)).max(20).optional(),
  }),
});

export const updateDoctorSchema = z.object({
  body: z
    .object({
      specialty: z.string().min(1).max(100).optional(),
      experienceYears: z.number().int().nonnegative().max(70).optional(),
      consultationFee: z.number().nonnegative().max(1000000).optional(),
      bio: z.string().max(5000).optional(),
      education: z.string().max(5000).optional(),
      languages: z.array(z.string().max(50)).max(20).optional(),
      // Silently accepted but stripped by the controller (admin-only fields)
      isActive: z.boolean().optional(),
      isVerified: z.boolean().optional(),
      licenseNumber: z.string().optional(),
    })
    .refine((body) => body.licenseNumber === undefined, {
      message: 'License number can only be changed by an admin',
      path: ['licenseNumber'],
    }),
});

export const listDoctorsSchema = z.object({
  query: z.object({
    specialty: z.string().max(100).optional(),
    search: z.string().max(200).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    maxFee: z.coerce.number().nonnegative().optional(),
    languages: z.string().max(500).optional(),
    availabilityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').optional(),
    isActive: z.enum(['true', 'false']).optional(),
    isVerified: z.enum(['true', 'false']).optional(),
    sortBy: z.enum(['rating', 'experience', 'fee']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
});

export const createSlotSchema = z.object({
  body: z.object({
    startTime: z.string().datetime({ offset: true, message: 'Invalid start time (use ISO 8601)' }),
    endTime: z.string().datetime({ offset: true, message: 'Invalid end time (use ISO 8601)' }),
    consultationType: z.enum(['VIDEO', 'PHONE', 'CHAT', 'IN_PERSON']).default('VIDEO'),
    price: z.number().nonnegative().max(1000000).optional(),
  }),
});

export const listSlotsSchema = z.object({
  query: z.object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
  }),
});
