import { z } from 'zod';

export const createTournamentSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Tournament name must be at least 3 characters').max(100),
    description: z.string().max(500).optional(),
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format'),
  }),
});

export const updateTournamentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tournament ID format'),
  }),
  body: z.object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().max(500).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED']).optional(),
  }),
});

export const getTournamentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tournament ID format'),
  }),
});

export const getTournamentsSchema = z.object({
  query: z.object({
    status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});
