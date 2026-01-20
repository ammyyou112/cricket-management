import { Router } from 'express';
import { MatchController } from '@/controllers/match.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import {
  createMatchSchema,
  updateMatchSchema,
  updateMatchScoreSchema,
  addPlayerStatSchema,
  getMatchByIdSchema,
  getMatchesSchema,
} from '@/validators/match.validator';
import { UserRole } from '@prisma/client';

const router = Router();

// All match routes require authentication
router.use(authenticate);

// Get all matches
router.get(
  '/',
  validate(getMatchesSchema),
  MatchController.getMatches
);

// Create match (admin or captain)
router.post(
  '/',
  validate(createMatchSchema),
  MatchController.createMatch
);

// Get match by ID
router.get(
  '/:id',
  validate(getMatchByIdSchema),
  MatchController.getMatchById
);

// Update match (admin or captains)
router.patch(
  '/:id',
  validate(updateMatchSchema),
  MatchController.updateMatch
);

// Update match score (admin or captains)
router.post(
  '/:id/score',
  validate(updateMatchScoreSchema),
  MatchController.updateMatchScore
);

// Add player statistics (admin or captains)
router.post(
  '/:id/stats',
  validate(addPlayerStatSchema),
  MatchController.addPlayerStat
);

// Delete match (admin only)
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(getMatchByIdSchema),
  MatchController.deleteMatch
);

export default router;

