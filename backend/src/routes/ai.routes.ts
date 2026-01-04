/**
 * AI Routes
 * Routes for AI-powered features
 */

import { Router } from 'express';
import { AIController } from '@/controllers/ai.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// Player performance analysis
router.get('/player-analysis/:playerId', AIController.getPlayerAnalysis);

export default router;

