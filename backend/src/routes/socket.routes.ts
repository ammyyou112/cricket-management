/**
 * Cricket 360 - Socket.io Routes
 * Status endpoint for Socket.io server
 */

import { Router, Request, Response } from 'express';
import { getIO } from '@/sockets/socket';
import { ResponseUtil } from '@/utils/response';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

/**
 * Get Socket.io connection status
 * GET /api/v1/socket/status
 */
router.get('/status', authenticate, (req: Request, res: Response): void => {
  try {
    const io = getIO();
    const socketsCount = io.sockets.sockets.size;
    const rooms = Array.from(io.sockets.adapter.rooms.keys());

    ResponseUtil.success(
      res,
      {
        connected: true,
        activeConnections: socketsCount,
        rooms,
      },
      'Socket.io status retrieved successfully'
    );
  } catch (error: any) {
    ResponseUtil.error(res, 'Socket.io not initialized', 500, error.message);
  }
});

export default router;

