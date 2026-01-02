import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(100).optional(),
    playerType: z
      .enum(['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'])
      .optional(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional(),
    city: z.string().min(2).max(100).optional(),
    profilePictureUrl: z.string().url().optional(),
    locationLatitude: z.number().min(-90).max(90).optional(),
    locationLongitude: z.number().min(-180).max(180).optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});

export const updateUserRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
  body: z.object({
    role: z.enum(['PLAYER', 'CAPTAIN', 'ADMIN']),
  }),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});

export const searchUsersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    role: z.enum(['PLAYER', 'CAPTAIN', 'ADMIN']).optional(),
    playerType: z
      .enum(['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'])
      .optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});
