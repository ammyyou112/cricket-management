import { Router } from 'express';
import { TournamentController } from '@/controllers/tournament.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import {
  createTournamentSchema,
  updateTournamentSchema,
  getTournamentByIdSchema,
  getTournamentsSchema,
} from '@/validators/tournament.validator';
import { UserRole } from '@prisma/client';

const router = Router();

// All tournament routes require authentication
router.use(authenticate);

// Get all tournaments
router.get(
  '/',
  validate(getTournamentsSchema),
  TournamentController.getTournaments
);

// Create tournament (admin only)
router.post(
  '/',
  authorize(UserRole.ADMIN),
  validate(createTournamentSchema),
  TournamentController.createTournament
);

// Get tournament by ID
router.get(
  '/:id',
  validate(getTournamentByIdSchema),
  TournamentController.getTournamentById
);

// Update tournament (admin only)
router.patch(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(updateTournamentSchema),
  TournamentController.updateTournament
);

// Delete tournament (admin only)
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(getTournamentByIdSchema),
  TournamentController.deleteTournament
);

export default router;

