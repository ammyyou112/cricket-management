import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { ResponseUtil } from '@/utils/response';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import logger from '@/utils/logger';

export class ScoringController {
  /**
   * Start scoring (captain only)
   * POST /api/v1/scoring/:matchId/start
   */
  static async startScoring(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { matchId } = req.params;
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          teamA: { select: { captainId: true, teamName: true } },
          teamB: { select: { captainId: true, teamName: true } }
        }
      });

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      // Only captains of participating teams can start scoring
      if (userRole !== 'ADMIN' && 
          match.teamA.captainId !== userId && 
          match.teamB.captainId !== userId) {
        throw new ForbiddenError('Only team captains can start scoring');
      }

      // Check if already started
      if (match.scoringStatus === 'IN_PROGRESS') {
        throw new BadRequestError('Scoring has already been started');
      }

      // Update match
      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          scoringStatus: 'IN_PROGRESS',
          scoringStartedAt: new Date(),
          scoringStartedBy: userId,
          status: 'LIVE'
        }
      });

      logger.info(`Scoring started for match ${matchId} by ${userId}`);

      ResponseUtil.success(res, updatedMatch, 'Scoring started successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Update score (real-time)
   * PATCH /api/v1/scoring/:matchId/update
   */
  static async updateScore(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { matchId } = req.params;
      const userId = (req as any).userId;
      const {
        currentInning,
        teamAScore,
        teamAWickets,
        teamAOvers,
        teamBScore,
        teamBWickets,
        teamBOvers
      } = req.body;

      const match = await prisma.match.findUnique({
        where: { id: matchId }
      });

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      if (match.scoringStatus !== 'IN_PROGRESS') {
        throw new BadRequestError('Scoring has not been started for this match');
      }

      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          currentInning: currentInning ?? match.currentInning,
          teamAScore: teamAScore ?? match.teamAScore,
          teamAWickets: teamAWickets ?? match.teamAWickets,
          teamAOvers: teamAOvers ?? match.teamAOvers,
          teamBScore: teamBScore ?? match.teamBScore,
          teamBWickets: teamBWickets ?? match.teamBWickets,
          teamBOvers: teamBOvers ?? match.teamBOvers
        },
        include: {
          teamA: { select: { teamName: true } },
          teamB: { select: { teamName: true } }
        }
      });

      logger.info(`Score updated for match ${matchId} by ${userId}`);

      ResponseUtil.success(res, updatedMatch, 'Score updated successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * End scoring
   * POST /api/v1/scoring/:matchId/end
   */
  static async endScoring(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { matchId } = req.params;
      const { winnerId } = req.body;

      const match = await prisma.match.findUnique({
        where: { id: matchId }
      });

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      if (match.scoringStatus !== 'IN_PROGRESS') {
        throw new BadRequestError('Scoring is not in progress');
      }

      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          scoringStatus: 'COMPLETED',
          scoringCompletedAt: new Date(),
          status: 'COMPLETED',
          winnerTeamId: winnerId || null
        }
      });

      logger.info(`Scoring completed for match ${matchId}`);

      ResponseUtil.success(res, updatedMatch, 'Scoring completed successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get live score
   * GET /api/v1/scoring/:matchId/live
   */
  static async getLiveScore(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { matchId } = req.params;

      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          teamA: { select: { id: true, teamName: true, logoUrl: true } },
          teamB: { select: { id: true, teamName: true, logoUrl: true } }
        }
      });

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      ResponseUtil.success(res, match, 'Live score retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}

