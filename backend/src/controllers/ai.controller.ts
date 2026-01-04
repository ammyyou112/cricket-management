/**
 * AI Controller
 * Handles AI-powered performance analytics endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { aiService, PlayerStatInput } from '@/services/ai.service';
import { ResponseUtil } from '@/utils/response';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/utils/errors';
import logger from '@/utils/logger';

export class AIController {
  /**
   * Get AI performance analysis for a player
   * GET /api/v1/ai/player-analysis/:playerId
   */
  static async getPlayerAnalysis(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const playerId = req.params.playerId;
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      // Validate playerId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(playerId)) {
        throw new BadRequestError('Invalid player ID format');
      }

      // Check permissions: User can only view their own analysis OR user is ADMIN
      if (userId !== playerId && userRole !== 'ADMIN') {
        throw new ForbiddenError('You can only view your own performance analysis');
      }

      // Fetch player from database
      const player = await prisma.user.findUnique({
        where: { id: playerId },
        select: {
          id: true,
          fullName: true,
          playerType: true,
        },
      });

      if (!player) {
        throw new NotFoundError('Player not found');
      }

      // Fetch player stats from database (last 10 matches)
      const stats = await prisma.playerStat.findMany({
        where: { playerId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          match: {
            select: { matchDate: true },
          },
        },
      });

      // Validate minimum data requirement
      if (stats.length < 3) {
        // Return error with matchesPlayed count for frontend to display progress
        res.status(400).json({
          success: false,
          message: 'Not enough matches for analysis',
          matchesPlayed: stats.length,
          required: 3,
        });
        return;
      }

      // Format stats for AI service
      const formattedStats: PlayerStatInput[] = stats.map((stat) => ({
        matchDate: stat.match.matchDate.toISOString().split('T')[0], // YYYY-MM-DD
        runsScored: stat.runsScored || 0,
        wicketsTaken: stat.wicketsTaken || 0,
        ballsFaced: stat.ballsFaced || 0,
        oversBowled: Number(stat.oversBowled) || 0,
        runsConceded: stat.runsConceded || 0,
        catches: stat.catches || 0,
        stumpings: stat.stumpings || 0,
      }));

      // Get player type (default to PLAYER if null)
      const playerType = player.playerType || 'PLAYER';

      logger.info(`🤖 Analyzing performance for player: ${playerId} (${playerType})`);

      // Call AI service
      logger.info(`🤖 Calling AI service with ${formattedStats.length} matches...`);
      const analysis = await aiService.analyzePlayerPerformance(formattedStats, playerType);
      logger.info(`✅ AI service returned analysis:`, { trend: analysis.trend, suggestionsCount: analysis.suggestions.length });

      // Return response
      const responseData = {
        playerName: player.fullName,
        playerType: playerType,
        matchesAnalyzed: stats.length,
        trend: analysis.trend,
        summary: analysis.summary,
        suggestions: analysis.suggestions,
      };

      logger.info(`✅ AI analysis completed for player: ${playerId}`, { 
        playerName: responseData.playerName,
        trend: responseData.trend,
        matchesAnalyzed: responseData.matchesAnalyzed 
      });

      // Add cache-control headers to prevent caching
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      // Add timestamp to response
      const responseWithTimestamp = {
        ...responseData,
        generatedAt: new Date().toISOString(),
      };

      ResponseUtil.success(res, responseWithTimestamp, 'Performance analysis generated successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}

