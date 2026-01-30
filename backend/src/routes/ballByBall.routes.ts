import { Router } from 'express';
import { BallByBallController } from '@/controllers/ballByBall.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Enter a ball
router.post('/:matchId', BallByBallController.enterBall);

// Undo last ball
router.delete('/:matchId/last', BallByBallController.undoLastBall);

// Get comprehensive scoring data
router.get('/:matchId/data', BallByBallController.getScoringData);

// Get balls by match
router.get('/:matchId', BallByBallController.getBallsByMatch);

// Get over summary
router.get('/:matchId/over/:innings/:overNumber', BallByBallController.getOverSummary);

export default router;

