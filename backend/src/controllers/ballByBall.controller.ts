import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { ResponseUtil } from '@/utils/response';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import logger from '@/utils/logger';
import { AuditAction, ApprovalType, WicketType, Prisma } from '@prisma/client';
import { auditService } from '@/services/audit.service';
import { retryDbOperation } from '@/utils/dbRetry';

export class BallByBallController {
  /**
   * Enter a ball
   * POST /api/v1/balls/:matchId
   */
  static async enterBall(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { matchId } = req.params;
      const userId = (req as any).userId;
      const {
        innings,
        overNumber,
        ballNumber,
        batsmanOnStrike,
        batsmanNonStrike,
        bowler,
        runs,
        isWicket,
        wicketType,
        dismissedPlayer,
        fielder,
        isWide,
        isNoBall,
        isBye,
        isLegBye
      } = req.body;

      // Validate matchId format
      if (!matchId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId)) {
        throw new BadRequestError('Invalid match ID format');
      }

      // Validate required fields
      if (!innings || !overNumber || !ballNumber || !batsmanOnStrike || !batsmanNonStrike || !bowler) {
        throw new BadRequestError('Missing required fields: innings, overNumber, ballNumber, batsmanOnStrike, batsmanNonStrike, bowler');
      }

      // Validate innings (1 or 2)
      if (innings !== 1 && innings !== 2) {
        throw new BadRequestError('Innings must be 1 or 2');
      }

      // Validate ball number (1-6 for legal balls, 7+ for extras)
      if (ballNumber < 1 || ballNumber > 10) {
        throw new BadRequestError('Ball number must be between 1 and 10');
      }

      // Validate runs
      if (typeof runs !== 'number' || runs < 0 || runs > 6) {
        throw new BadRequestError('Runs must be a number between 0 and 6');
      }

      // Validate wicket
      if (isWicket && !wicketType) {
        throw new BadRequestError('Wicket type is required when isWicket is true');
      }

      // Get match with teams
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          teamA: { select: { id: true, captainId: true, teamName: true } },
          teamB: { select: { id: true, captainId: true, teamName: true } }
        }
      });

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      // Only captains can enter balls
      const isCaptain = match.teamA.captainId === userId || match.teamB.captainId === userId;
      const isAdmin = (req as any).userRole === 'ADMIN';
      if (!isCaptain && !isAdmin) {
        throw new ForbiddenError('Only team captains can enter balls');
      }

      // Validate match status
      const validStatuses = ['FIRST_INNINGS', 'SECOND_INNINGS'];
      if (!validStatuses.includes(match.status)) {
        throw new BadRequestError(`Cannot enter ball. Match status must be FIRST_INNINGS or SECOND_INNINGS. Current: ${match.status}`);
      }

      // Validate innings matches current status
      if (match.status === 'FIRST_INNINGS' && innings !== 1) {
        throw new BadRequestError('Cannot enter ball for second innings when match is in first innings');
      }
      if (match.status === 'SECOND_INNINGS' && innings !== 2) {
        throw new BadRequestError('Cannot enter ball for first innings when match is in second innings');
      }

      // Get current over to validate ball number
      const currentOverBalls = await prisma.ball.findMany({
        where: {
          matchId,
          innings,
          overNumber,
          isWide: false,
          isNoBall: false
        },
        orderBy: { ballNumber: 'asc' }
      });

      const legalBallsInOver = currentOverBalls.length;
      if (legalBallsInOver >= 6 && !isWide && !isNoBall) {
        throw new BadRequestError('Cannot add more than 6 legal balls per over');
      }

      // Validate players exist and are from correct teams
      const [striker, nonStriker, bowlerUser] = await Promise.all([
        prisma.user.findUnique({ where: { id: batsmanOnStrike } }),
        prisma.user.findUnique({ where: { id: batsmanNonStrike } }),
        prisma.user.findUnique({ where: { id: bowler } })
      ]);

      if (!striker || !nonStriker || !bowlerUser) {
        throw new BadRequestError('Invalid player IDs');
      }

      // Determine batting team based on innings
      const battingTeamId = innings === 1 ? match.teamAId : match.teamBId;
      const bowlingTeamId = innings === 1 ? match.teamBId : match.teamAId;

      // Validate bowler is from bowling team
      const bowlerTeam = await prisma.teamMember.findFirst({
        where: {
          playerId: bowler,
          teamId: bowlingTeamId,
          status: 'ACTIVE'
        }
      });

      if (!bowlerTeam) {
        throw new BadRequestError('Bowler must be from the bowling team');
      }

      // Use transaction for atomic operations with retry and increased timeout
      const result = await retryDbOperation(
        () => prisma.$transaction(async (tx) => {
        // Create ball record
        const ball = await tx.ball.create({
          data: {
            matchId,
            innings,
            overNumber,
            ballNumber,
            batsmanOnStrike,
            batsmanNonStrike,
            bowler,
            runs,
            isWicket: isWicket || false,
            wicketType: isWicket ? (wicketType as WicketType) : null,
            dismissedPlayer: isWicket ? dismissedPlayer : null,
            fielder: isWicket && (wicketType === 'CAUGHT' || wicketType === 'RUN_OUT') ? fielder : null,
            isWide: isWide || false,
            isNoBall: isNoBall || false,
            isBye: isBye || false,
            isLegBye: isLegBye || false,
            enteredBy: userId
          },
          include: {
            striker: { select: { id: true, fullName: true } },
            nonStriker: { select: { id: true, fullName: true } },
            bowlerUser: { select: { id: true, fullName: true } }
          }
        });

        // Calculate and update match scores (now optimized with database aggregation)
        await BallByBallController.updateMatchScoresFromBalls(tx, matchId, innings);

        return ball;
      }, {
        timeout: 20000 // 20 seconds (safety margin, should complete in 1-3 seconds with optimization)
      }),
      {
        maxRetries: 2,
        initialDelay: 1000,
        maxDelay: 5000
      }
    );

      // Create audit log OUTSIDE transaction (non-critical, can fail without breaking)
      try {
        await auditService.logAction({
          matchId,
          action: AuditAction.BALL_ENTERED,
          performedBy: userId,
          ballNumber,
          overNumber,
          newState: {
            innings,
            overNumber,
            ballNumber,
            runs,
            isWicket,
            wicketType
          }
        });
      } catch (auditError) {
        // Log but don't fail - audit is non-critical
        logger.warn('Failed to create audit log (non-critical):', auditError);
      }

      logger.info(`Ball entered for match ${matchId} by ${userId}: Over ${overNumber}.${ballNumber}, ${runs} runs`);

      // TODO: Emit WebSocket event for real-time updates

      ResponseUtil.created(res, result, 'Ball entered successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Undo last ball
   * DELETE /api/v1/balls/:matchId/last
   */
  static async undoLastBall(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { matchId } = req.params;
      const userId = (req as any).userId;
      const { innings } = req.query;

      // Validate matchId
      if (!matchId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId)) {
        throw new BadRequestError('Invalid match ID format');
      }

      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          teamA: { select: { captainId: true } },
          teamB: { select: { captainId: true } }
        }
      });

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      // Only captains can undo
      const isCaptain = match.teamA.captainId === userId || match.teamB.captainId === userId;
      const isAdmin = (req as any).userRole === 'ADMIN';
      if (!isCaptain && !isAdmin) {
        throw new ForbiddenError('Only team captains can undo balls');
      }

      // Get last ball
      const whereClause: any = { matchId };
      if (innings) {
        whereClause.innings = parseInt(innings as string);
      }

      const lastBall = await prisma.ball.findFirst({
        where: whereClause,
        orderBy: { timestamp: 'desc' }
      });

      if (!lastBall) {
        throw new NotFoundError('No ball found to undo');
      }

      // Use transaction with retry and increased timeout
      await retryDbOperation(
        () => prisma.$transaction(async (tx) => {
          // Delete ball
          await tx.ball.delete({
            where: { id: lastBall.id }
          });

          // Recalculate match scores (now optimized with database aggregation)
          await BallByBallController.updateMatchScoresFromBalls(tx, matchId, lastBall.innings);
        }, {
          timeout: 20000 // 20 seconds (safety margin, should complete in 1-3 seconds with optimization)
        }),
        {
          maxRetries: 2,
          initialDelay: 1000,
          maxDelay: 5000
        }
      );

      // Create audit log OUTSIDE transaction (non-critical, can fail without breaking)
      try {
        await auditService.logAction({
          matchId,
          action: AuditAction.BALL_DELETED,
          performedBy: userId,
          ballNumber: lastBall.ballNumber,
          overNumber: lastBall.overNumber,
          previousState: {
            innings: lastBall.innings,
            overNumber: lastBall.overNumber,
            ballNumber: lastBall.ballNumber,
            runs: lastBall.runs,
            isWicket: lastBall.isWicket
          }
        });
      } catch (auditError) {
        // Log but don't fail - audit is non-critical
        logger.warn('Failed to create audit log (non-critical):', auditError);
      }

      logger.info(`Last ball undone for match ${matchId} by ${userId}`);

      ResponseUtil.success(res, null, 'Last ball undone successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get balls by match
   * GET /api/v1/balls/:matchId
   */
  static async getBallsByMatch(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { matchId } = req.params;
      const { innings, overNumber } = req.query;

      if (!matchId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId)) {
        throw new BadRequestError('Invalid match ID format');
      }

      // Verify match exists first
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { id: true }
      });

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      const whereClause: any = { matchId };
      if (innings) {
        whereClause.innings = parseInt(innings as string);
      }
      if (overNumber) {
        whereClause.overNumber = parseInt(overNumber as string);
      }

      try {
        const balls = await prisma.ball.findMany({
          where: whereClause,
          include: {
            striker: { select: { id: true, fullName: true } },
            nonStriker: { select: { id: true, fullName: true } },
            bowlerUser: { select: { id: true, fullName: true } },
            enteredByUser: { select: { id: true, fullName: true } }
          },
          orderBy: [
            { innings: 'asc' },
            { overNumber: 'asc' },
            { ballNumber: 'asc' },
            { timestamp: 'asc' }
          ]
        });

        ResponseUtil.success(res, balls, 'Balls retrieved successfully');
        return;
      } catch (prismaError: any) {
        // Handle Prisma errors gracefully
        logger.error('Prisma error in getBallsByMatch:', {
          error: prismaError.message,
          code: prismaError.code,
          matchId
        });

        // If table doesn't exist (P2021) or column doesn't exist, return empty array
        if (prismaError.code === 'P2021' || prismaError.code === 'P2009' || 
            prismaError.message?.includes('does not exist') ||
            prismaError.message?.includes('Unknown column')) {
          logger.warn(`Ball table or columns not found, returning empty array for match ${matchId}`);
          ResponseUtil.success(res, [], 'No balls found (table may not be migrated yet)');
          return;
        }

        // Re-throw other Prisma errors
        throw prismaError;
      }
    } catch (error: any) {
      logger.error('Error in getBallsByMatch:', {
        error: error.message,
        stack: error.stack,
        matchId: req.params.matchId
      });
      next(error);
      return;
    }
  }

  /**
   * Get comprehensive scoring data for a match
   * GET /api/v1/balls/:matchId/data
   */
  static async getScoringData(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { matchId } = req.params;
      const userId = (req as any).userId;

      if (!matchId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId)) {
        throw new BadRequestError('Invalid match ID format');
      }

      // 1. Get match with full details
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          teamA: {
            select: {
              id: true,
              teamName: true,
              captainId: true,
              captain: {
                select: { id: true, fullName: true }
              }
            }
          },
          teamB: {
            select: {
              id: true,
              teamName: true,
              captainId: true,
              captain: {
                select: { id: true, fullName: true }
              }
            }
          }
        }
      });

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      // 2. Get Team A players (approved members only)
      const teamAPlayers = await prisma.teamMember.findMany({
        where: {
          teamId: match.teamAId,
          status: 'ACTIVE'
        },
        include: {
          player: {
            select: {
              id: true,
              fullName: true,
              playerType: true
            }
          }
        }
      });

      // 3. Get Team B players (approved members only)
      const teamBPlayers = await prisma.teamMember.findMany({
        where: {
          teamId: match.teamBId,
          status: 'ACTIVE'
        },
        include: {
          player: {
            select: {
              id: true,
              fullName: true,
              playerType: true
            }
          }
        }
      });

      // 4. Get all balls for this match
      let balls: any[] = [];
      try {
        balls = await prisma.ball.findMany({
          where: { matchId },
          include: {
            striker: { select: { id: true, fullName: true } },
            nonStriker: { select: { id: true, fullName: true } },
            bowlerUser: { select: { id: true, fullName: true } },
            enteredByUser: { select: { id: true, fullName: true } }
          },
          orderBy: [
            { innings: 'asc' },
            { overNumber: 'asc' },
            { ballNumber: 'asc' },
            { timestamp: 'asc' }
          ]
        });
      } catch (prismaError: any) {
        // If Ball table doesn't exist, return empty array
        if (prismaError.code === 'P2021' || prismaError.message?.includes('does not exist')) {
          logger.warn(`Ball table not found for match ${matchId}, returning empty balls array`);
          balls = [];
        } else {
          throw prismaError;
        }
      }

      // 5. Calculate scores from balls
      const teamABalls = balls.filter(b => b.innings === 1);
      const teamBBalls = balls.filter(b => b.innings === 2);

      const calculateScore = (ballsList: any[]) => {
        const runs = ballsList.reduce((sum, ball) => sum + (ball.runs || 0), 0);
        const wickets = ballsList.filter(ball => ball.isWicket).length;
        const legalBalls = ballsList.filter(ball => !ball.isWide && !ball.isNoBall);
        const overs = Math.floor(legalBalls.length / 6) + (legalBalls.length % 6) / 10;
        return { runs, wickets, overs };
      };

      const teamAScore = calculateScore(teamABalls);
      const teamBScore = calculateScore(teamBBalls);

      // Use match scores if available, otherwise use calculated scores
      const finalTeamAScore = {
        runs: match.teamAScore ?? teamAScore.runs,
        wickets: match.teamAWickets ?? teamAScore.wickets,
        overs: match.teamAOvers ?? teamAScore.overs
      };

      const finalTeamBScore = {
        runs: match.teamBScore ?? teamBScore.runs,
        wickets: match.teamBWickets ?? teamBScore.wickets,
        overs: match.teamBOvers ?? teamBScore.overs
      };

      // 6. Determine current innings and batting/bowling teams
      const currentInnings = match.status === 'SECOND_INNINGS' ? 2 : 1;
      const battingTeam = currentInnings === 1 ? match.teamA : match.teamB;
      const bowlingTeam = currentInnings === 1 ? match.teamB : match.teamA;
      const battingPlayers = currentInnings === 1 
        ? teamAPlayers.map(m => ({ id: m.player.id, name: m.player.fullName, type: m.player.playerType }))
        : teamBPlayers.map(m => ({ id: m.player.id, name: m.player.fullName, type: m.player.playerType }));
      const bowlingPlayers = currentInnings === 1
        ? teamBPlayers.map(m => ({ id: m.player.id, name: m.player.fullName, type: m.player.playerType }))
        : teamAPlayers.map(m => ({ id: m.player.id, name: m.player.fullName, type: m.player.playerType }));

      // 7. Get current over balls
      const currentInningsBalls = currentInnings === 1 ? teamABalls : teamBBalls;
      const currentOverNumber = Math.floor(currentInningsBalls.length / 6) + 1;
      const currentOverBalls = currentInningsBalls.filter(
        b => b.overNumber === currentOverNumber
      );

      // 8. Check authorization
      const isAuthorized = 
        match.teamA.captainId === userId || 
        match.teamB.captainId === userId ||
        (req as any).userRole === 'ADMIN';

      ResponseUtil.success(res, {
        match: {
          id: match.id,
          teamA: {
            id: match.teamA.id,
            name: match.teamA.teamName,
            captainId: match.teamA.captainId,
            captainName: match.teamA.captain?.fullName,
            score: finalTeamAScore
          },
          teamB: {
            id: match.teamB.id,
            name: match.teamB.teamName,
            captainId: match.teamB.captainId,
            captainName: match.teamB.captain?.fullName,
            score: finalTeamBScore
          },
          venue: match.venue,
          matchDate: match.matchDate,
          status: match.status,
          currentInnings,
          battingTeam: {
            id: battingTeam.id,
            name: battingTeam.teamName
          },
          bowlingTeam: {
            id: bowlingTeam.id,
            name: bowlingTeam.teamName
          }
        },
        players: {
          batting: battingPlayers,
          bowling: bowlingPlayers
        },
        balls,
        currentOver: currentOverBalls,
        currentOverNumber,
        isAuthorized
      }, 'Scoring data retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get over summary
   * GET /api/v1/balls/:matchId/over/:innings/:overNumber
   */
  static async getOverSummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { matchId, innings, overNumber } = req.params;

      if (!matchId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId)) {
        throw new BadRequestError('Invalid match ID format');
      }

      const balls = await prisma.ball.findMany({
        where: {
          matchId,
          innings: parseInt(innings),
          overNumber: parseInt(overNumber)
        },
        include: {
          striker: { select: { id: true, fullName: true } },
          bowlerUser: { select: { id: true, fullName: true } }
        },
        orderBy: { ballNumber: 'asc' }
      });

      const runs = balls.reduce((sum, ball) => sum + ball.runs, 0);
      const wickets = balls.filter(ball => ball.isWicket).length;
      const legalBalls = balls.filter(ball => !ball.isWide && !ball.isNoBall).length;

      ResponseUtil.success(res, {
        overNumber: parseInt(overNumber),
        innings: parseInt(innings),
        balls,
        runs,
        wickets,
        legalBalls,
        isComplete: legalBalls >= 6
      }, 'Over summary retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Helper: Update match scores from balls (OPTIMIZED with Prisma aggregates)
   * Uses Prisma aggregate methods in parallel - fast and reliable within transactions
   */
  private static async updateMatchScoresFromBalls(
    tx: any, // Prisma transaction client
    matchId: string,
    innings: number
  ): Promise<void> {
    // Use Prisma aggregate methods in parallel - fast and reliable
    // This approach works well within transactions and is optimized by Prisma
    const [runsResult, wicketsResult, legalBallsResult] = await Promise.all([
      // Sum of all runs
      tx.ball.aggregate({
        where: { matchId, innings },
        _sum: { runs: true }
      }),
      // Count of wickets
      tx.ball.count({
        where: { 
          matchId, 
          innings,
          isWicket: true
        }
      }),
      // Count of legal balls (not wide, not no-ball)
      tx.ball.count({
        where: { 
          matchId, 
          innings,
          isWide: false,
          isNoBall: false
        }
      })
    ]);

    const totalRuns = runsResult._sum.runs || 0;
    const totalWickets = wicketsResult;
    const legalBalls = legalBallsResult;
    const totalOvers = Math.floor(legalBalls / 6) + (legalBalls % 6) / 10;

    // Update match scores based on innings
    if (innings === 1) {
      await tx.match.update({
        where: { id: matchId },
        data: {
          teamAScore: totalRuns,
          teamAWickets: totalWickets,
          teamAOvers: totalOvers
        }
      });
    } else {
      await tx.match.update({
        where: { id: matchId },
        data: {
          teamBScore: totalRuns,
          teamBWickets: totalWickets,
          teamBOvers: totalOvers
        }
      });
    }
  }
}

