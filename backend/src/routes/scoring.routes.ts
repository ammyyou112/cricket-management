import { Router } from 'express';
import { ScoringController } from '@/controllers/scoring.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

// Get live score (public, no auth required for viewing)
router.get('/:matchId/live', ScoringController.getLiveScore);

// All other scoring routes require authentication
router.use(authenticate);

// Start scoring
router.post('/:matchId/start', ScoringController.startScoring);

// Update score
router.patch('/:matchId/update', ScoringController.updateScore);

// End scoring
router.post('/:matchId/end', ScoringController.endScoring);

export default router;

