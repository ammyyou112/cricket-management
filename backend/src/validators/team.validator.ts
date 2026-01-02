import { z } from 'zod';

export const createTeamSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, 'Team name must be at least 3 characters')
      .max(50, 'Team name must not exceed 50 characters'),
    description: z.string().max(500).optional(),
    logoUrl: z.string().url('Invalid logo URL').optional(),
  }),
});

export const updateTeamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid team ID format'),
  }),
  body: z.object({
    name: z.string().min(3).max(50).optional(),
    description: z.string().max(500).optional(),
    logoUrl: z.string().url('Invalid logo URL').optional(),
  }),
});

export const getTeamByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid team ID format'),
  }),
});

export const getTeamsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    captainId: z.string().uuid().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export const addMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid team ID format'),
  }),
  body: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid team ID format'),
    userId: z.string().uuid('Invalid user ID format'),
  }),
});

export const updateMemberStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid team ID format'),
    userId: z.string().uuid('Invalid user ID format'),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'PENDING', 'INVITED', 'REJECTED']),
  }),
});

export const transferCaptainSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid team ID format'),
  }),
  body: z.object({
    newCaptainId: z.string().uuid('Invalid user ID format'),
  }),
});
