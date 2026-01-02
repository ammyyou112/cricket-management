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

export default router;

