/**
 * Cricket 360 - Main Router
 * Combines all route modules
 */

import { Router } from 'express';
import { APP_CONFIG } from '@/config/constants';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import teamRoutes from './team.routes';
import tournamentRoutes from './tournament.routes';
import matchRoutes from './match.routes';
import uploadRoutes from './upload.routes';
import socketRoutes from './socket.routes';
import aiRoutes from './ai.routes';
import scoringRoutes from './scoring.routes';
import verificationRoutes from './verification.routes';
import approvalRoutes from './approval.routes';
import ballByBallRoutes from './ballByBall.routes';
import settingsRoutes from './settings.routes';
import auditRoutes from './audit.routes';

const router = Router();

// Welcome route
router.get('/', (req, res) => {
  res.json({
    message: 'Cricket 360 API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: APP_CONFIG.API_PREFIX,
      auth: `${APP_CONFIG.API_PREFIX}/auth`,
      users: `${APP_CONFIG.API_PREFIX}/users`,
      teams: `${APP_CONFIG.API_PREFIX}/teams`,
      tournaments: `${APP_CONFIG.API_PREFIX}/tournaments`,
      matches: `${APP_CONFIG.API_PREFIX}/matches`,
      upload: `${APP_CONFIG.API_PREFIX}/upload`,
      socket: `${APP_CONFIG.API_PREFIX}/socket`,
      ai: `${APP_CONFIG.API_PREFIX}/ai`,
      scoring: `${APP_CONFIG.API_PREFIX}/scoring`,
      verification: `${APP_CONFIG.API_PREFIX}/verification`,
      approval: `${APP_CONFIG.API_PREFIX}/approval`,
      balls: `${APP_CONFIG.API_PREFIX}/balls`,
      settings: `${APP_CONFIG.API_PREFIX}/settings`,
      audit: `${APP_CONFIG.API_PREFIX}/audit`,
    },
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/matches', matchRoutes);
router.use('/upload', uploadRoutes);
router.use('/socket', socketRoutes);
router.use('/ai', aiRoutes);
router.use('/scoring', scoringRoutes);
router.use('/verification', verificationRoutes);
router.use('/approval', approvalRoutes);
router.use('/balls', ballByBallRoutes);
router.use('/settings', settingsRoutes);
router.use('/audit', auditRoutes);

export default router;

