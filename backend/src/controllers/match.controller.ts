import { Request, Response, NextFunction } from 'express';
import { MatchService } from '@/services/match.service';
import { ResponseUtil } from '@/utils/response';
import logger from '@/utils/logger';
import { prisma } from '@/config/database';
import { ForbiddenError } from '@/utils/errors';

export class MatchController {
  /**
   * Create new match
   * POST /api/v1/matches
   */
  static async createMatch(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const { teamAId, teamBId } = req.body;

      // ✅ Allow ADMIN and CAPTAIN
      if (!['ADMIN', 'CAPTAIN'].includes(userRole)) {
        throw new ForbiddenError('Only administrators and team captains can schedule matches');
      }

      // ✅ If captain, must be captain of one of the teams
      if (userRole === 'CAPTAIN') {
        const userTeams = await prisma.team.findMany({
          where: { captainId: userId },
          select: { id: true }
        });
        
        const userTeamIds = userTeams.map(t => t.id);
        
        if (!userTeamIds.includes(teamAId) && !userTeamIds.includes(teamBId)) {
          throw new ForbiddenError('You can only schedule matches for teams you captain');
        }
      }

      const match = await MatchService.createMatch(req.body);

      logger.info(`Match created: ${match.id} - ${match.venue} by ${userRole} ${userId}`);

      ResponseUtil.created(res, match, 'Match created successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get all matches
   * GET /api/v1/matches
   */
  static async getMatches(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info(`Fetching matches with query: ${JSON.stringify(req.query)}`);
      const result = await MatchService.getMatches(req.query);

      logger.info(`Successfully fetched ${result.matches.length} matches`);
      ResponseUtil.paginated(
        res,
        result.matches,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
        },
        'Matches retrieved successfully'
      );
      return;
    } catch (error: any) {
      logger.error(`Error fetching matches: ${error.message}`, { error, query: req.query });
      next(error);
      return;
    }
  }

  /**
   * Get match by ID
   * GET /api/v1/matches/:id
   */
  static async getMatchById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const match = await MatchService.getMatchById(req.params.id);

      ResponseUtil.success(res, match, 'Match retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Update match
   * PATCH /api/v1/matches/:id
   */
  static async updateMatch(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      const match = await MatchService.updateMatch(
        req.params.id,
        userId,
        userRole,
        req.body
      );

      logger.info(`Match updated: ${match.id}`);

      ResponseUtil.success(res, match, 'Match updated successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Update match score
   * POST /api/v1/matches/:id/score
   */
  static async updateMatchScore(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      const match = await MatchService.updateMatchScore(
        req.params.id,
        userId,
        userRole,
        req.body
      );

      logger.info(`Match score updated: ${match.id}`);

      ResponseUtil.success(res, match, 'Match score updated successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Add player statistics
   * POST /api/v1/matches/:id/stats
   */
  static async addPlayerStat(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      const playerStat = await MatchService.addPlayerStat(
        req.params.id,
        userId,
        userRole,
        req.body
      );

      logger.info(`Player stat added: Match ${req.params.id}, Player ${req.body.playerId}`);

      ResponseUtil.created(res, playerStat, 'Player statistics added successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Delete match
   * DELETE /api/v1/matches/:id
   */
  static async deleteMatch(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userRole = (req as any).userRole;

      await MatchService.deleteMatch(req.params.id, userRole);

      logger.info(`Match deleted: ${req.params.id}`);

      ResponseUtil.success(res, null, 'Match deleted successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}

