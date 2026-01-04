/**
 * Statistics Controller
 * Handles statistics-related requests
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { StatsService } from '@/services/stats.service';
import { ResponseUtil } from '@/utils/response';
import { NotFoundError, ForbiddenError } from '@/utils/errors';
import logger from '@/utils/logger';

export class StatsController {
  /**
   * Get player statistics summary
   * GET /api/v1/players/:playerId/stats/summary
   */
  static async getPlayerStatsSummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const playerId = req.params.playerId;
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      // Validate playerId is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(playerId)) {
        throw new NotFoundError('Invalid player ID format');
      }

      // Check permissions: User can only view their own stats OR user is ADMIN
      if (userId !== playerId && userRole !== 'ADMIN') {
        throw new ForbiddenError('You can only view your own statistics');
      }

      // Verify player exists
      const player = await prisma.user.findUnique({
        where: { id: playerId },
        select: { id: true, fullName: true },
      });

      if (!player) {
        throw new NotFoundError('Player not found');
      }

      // Get stats summary
      const summary = await StatsService.getPlayerStatsSummary(playerId);

      logger.info(`📊 Stats summary retrieved for player: ${playerId}`);

      ResponseUtil.success(res, summary, 'Player statistics retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get detailed player stats (all match records)
   * GET /api/v1/players/:playerId/stats
   */
  static async getPlayerStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const playerId = req.params.playerId;
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      // Validate playerId
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(playerId)) {
        throw new NotFoundError('Invalid player ID format');
      }

      // Check permissions
      if (userId !== playerId && userRole !== 'ADMIN') {
        throw new ForbiddenError('You can only view your own statistics');
      }

      // Get detailed stats
      const stats = await StatsService.getPlayerStats(playerId);

      logger.info(`📊 Detailed stats retrieved for player: ${playerId} (${stats.length} matches)`);

      ResponseUtil.success(res, stats, 'Player statistics retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}
