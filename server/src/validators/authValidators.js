import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z
      .string()
      .email('Invalid email address')
      .refine(
        (val) => !val.toLowerCase().endsWith('@clinova.com'),
        'Emails ending in @clinova.com are reserved for hospital staff'
      ),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    // Role is never accepted from public registration
    phone: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const updatePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

const addressSchema = z
  .object({
    street: z.string().max(200).optional().or(z.literal('')),
    city: z.string().max(100).optional().or(z.literal('')),
    state: z.string().max(100).optional().or(z.literal('')),
    zipCode: z.string().max(20).optional().or(z.literal('')),
    country: z.string().max(100).optional().or(z.literal('')),
  })
  .optional();

export const activateSchema = z.object({
  body: z.object({
    email: z.string().email(),
    token: z.string().min(20),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

/**
 * Self-service profile update.
 * Email is optional in the payload; controller only applies it for patients.
 * Role is never accepted.
 */
export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().min(2, 'Name must be at least 2 characters').max(120).optional(),
      email: z
        .string()
        .email('Invalid email address')
        .max(254)
        .optional(),
      phone: z.string().max(40).optional().or(z.literal('')),
      dateOfBirth: z
        .union([z.string().min(1), z.null(), z.literal('')])
        .optional(),
      gender: z
        .enum(['male', 'female', 'other', 'prefer_not_to_say', ''])
        .optional(),
      address: addressSchema,
    })
    .strict(),
});
