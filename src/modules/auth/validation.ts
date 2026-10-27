import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long'),
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    phone: z.string().max(20).optional(),
    role: z.string().optional().transform((val) => (val === 'DOCTOR' ? 'DOCTOR' : 'PATIENT')),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const loginMfaSchema = z.object({
  body: z.object({
    mfaToken: z.string().min(1, 'MFA challenge token is required'),
    token: z.string().length(6, 'MFA token must be 6 digits'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const mfaVerifySchema = z.object({
  body: z.object({
    token: z.string().length(6, 'MFA token must be 6 digits'),
  }),
});

export const mfaEnableSchema = z.object({
  body: z.object({
    token: z.string().length(6, 'MFA token must be 6 digits'),
  }),
});

export const mfaDisableSchema = z.object({
  body: z.object({
    token: z.string().length(6, 'MFA token must be 6 digits'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
  }),
});
