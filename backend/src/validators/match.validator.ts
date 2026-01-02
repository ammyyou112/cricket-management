import { z } from 'zod';

export const createMatchSchema = z.object({
  body: z.object({
    tournamentId: z.string().uuid('Invalid tournament ID format'),
    teamAId: z.string().uuid('Invalid team ID format'),
    teamBId: z.string().uuid('Invalid team ID format'),
    venue: z.string().min(3, 'Venue must be at least 3 characters').max(200),
    matchDate: z.string().datetime('Invalid match date format'),
    matchType: z.enum(['LEAGUE', 'KNOCKOUT', 'FRIENDLY']),
  }),
});

export const updateMatchSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid match ID format'),
  }),
  body: z.object({
    venue: z.string().min(3).max(200).optional(),
    matchDate: z.string().datetime().optional(),
    matchType: z.enum(['LEAGUE', 'KNOCKOUT', 'FRIENDLY']).optional(),
    status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(),
  }),
});

export const updateMatchScoreSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid match ID format'),
  }),
  body: z.object({
    teamAScore: z.object({
      runs: z.number().min(0),
      wickets: z.number().min(0).max(10),
      overs: z.number().min(0),
      extrasWide: z.number().min(0).optional(),
      extrasNoball: z.number().min(0).optional(),
      extrasBye: z.number().min(0).optional(),
      extrasLegbye: z.number().min(0).optional(),
      inningsNumber: z.number().min(1).max(2).optional(),
    }).optional(),
    teamBScore: z.object({
      runs: z.number().min(0),
      wickets: z.number().min(0).max(10),
      overs: z.number().min(0),
      extrasWide: z.number().min(0).optional(),
      extrasNoball: z.number().min(0).optional(),
      extrasBye: z.number().min(0).optional(),
      extrasLegbye: z.number().min(0).optional(),
      inningsNumber: z.number().min(1).max(2).optional(),
    }).optional(),
  }),
});

export const addPlayerStatSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid match ID format'),
  }),
  body: z.object({
    playerId: z.string().uuid('Invalid player ID format'),
    runs: z.number().min(0).optional(),
    ballsFaced: z.number().min(0).optional(),
    fours: z.number().min(0).optional(),
    sixes: z.number().min(0).optional(),
    wickets: z.number().min(0).optional(),
    oversBowled: z.number().min(0).optional(),
    runsConceded: z.number().min(0).optional(),
    catches: z.number().min(0).optional(),
    runOuts: z.number().min(0).optional(),
    stumpings: z.number().min(0).optional(),
  }),
});

export const getMatchByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid match ID format'),
  }),
});

export const getMatchesSchema = z.object({
  query: z.object({
    tournamentId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
    status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});
