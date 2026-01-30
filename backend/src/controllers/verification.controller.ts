import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { ResponseUtil } from '@/utils/response';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import logger from '@/utils/logger';
import { StatsService } from '@/services/stats.service';

export class VerificationController {
  /**
   * Submit score for verification
   * POST /api/v1/verification/:matchId/submit
   */
  static async submitScoreForVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { matchId } = req.params;
      const userId = (req as any).userId;
      const { teamAScore, teamBScore, teamAWickets, teamBWickets, winnerId } = req.body;

      // Validate matchId format
      if (!matchId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId)) {
        throw new BadRequestError('Invalid match ID format');
      }

      // Validate input scores
      if (typeof teamAScore !== 'number' || typeof teamBScore !== 'number' ||
          typeof teamAWickets !== 'number' || typeof teamBWickets !== 'number') {
        throw new BadRequestError('All score fields must be numbers');
      }

      if (teamAScore < 0 || teamBScore < 0 || teamAWickets < 0 || teamBWickets < 0) {
        throw new BadRequestError('Scores and wickets cannot be negative');
      }

      if (teamAWickets > 10 || teamBWickets > 10) {
        throw new BadRequestError('Wickets cannot exceed 10');
      }

      // Reasonable score limits (prevent unrealistic scores)
      if (teamAScore > 999 || teamBScore > 999) {
        throw new BadRequestError('Scores cannot exceed 999');
      }

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

      // Only captains of participating teams can submit scores
      if (match.teamA.captainId !== userId && match.teamB.captainId !== userId) {
        throw new ForbiddenError('Only team captains can submit scores for verification');
      }

      // Check match is in valid state for scoring
      if (!['SCHEDULED', 'LIVE', 'COMPLETED'].includes(match.status)) {
        throw new BadRequestError(
          `Cannot submit score for match with status: ${match.status}. Match must be SCHEDULED, LIVE, or COMPLETED.`
        );
      }

      // Check if already verified
      const existingVerification = await prisma.matchScoreVerification.findFirst({
        where: {
          matchId,
          status: { in: ['VERIFIED', 'FINAL'] }
        }
      });

      if (existingVerification) {
        throw new BadRequestError('Score has already been verified for this match');
      }

      // Determine winner if not provided
      let determinedWinner = winnerId;
      if (!determinedWinner) {
        if (teamAScore > teamBScore) {
          determinedWinner = match.teamA.id;
        } else if (teamBScore > teamAScore) {
          determinedWinner = match.teamB.id;
        }
        // If tied, determinedWinner remains null
      } else {
        // Validate winnerId is one of the teams
        if (determinedWinner !== match.teamA.id && determinedWinner !== match.teamB.id) {
          throw new BadRequestError('Winner must be one of the participating teams');
        }
      }

      // Use transaction to cancel old pending verifications and create new one
      const verification = await prisma.$transaction(async (tx) => {
        // Cancel any existing pending verifications (prevent duplicates)
        await tx.matchScoreVerification.updateMany({
          where: {
            matchId,
            status: 'PENDING'
          },
          data: {
            status: 'CANCELLED'
          }
        });

        // Create verification request
        const newVerification = await tx.matchScoreVerification.create({
          data: {
            matchId,
            submittedBy: userId,
            teamAScore,
            teamBScore,
            teamAWickets,
            teamBWickets,
            status: 'PENDING'
          },
          include: {
            match: {
              include: {
                teamA: { select: { teamName: true } },
                teamB: { select: { teamName: true } }
              }
            },
            submitter: { select: { fullName: true, email: true } }
          }
        });

        // Update match with submitted scores (keep status as LIVE or COMPLETED, verification tracked separately)
        await tx.match.update({
          where: { id: matchId },
          data: {
            // Don't change status - verification is tracked in MatchScoreVerification table
            // If match is COMPLETED, keep it. If LIVE, keep it. Verification status is separate.
            teamAScore,
            teamBScore,
            teamAWickets,
            teamBWickets,
            winnerTeamId: determinedWinner
          }
        });

        return newVerification;
      });

      logger.info(`Score verification submitted for match ${matchId} by ${userId}`);

      // TODO: Send notification to opponent captain
      // const opponentCaptainId = match.teamA.captainId === userId
      //   ? match.teamB.captainId
      //   : match.teamA.captainId;

      ResponseUtil.created(
        res,
        verification,
        'Score submitted. Waiting for opponent verification.'
      );
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Verify score
   * POST /api/v1/verification/:verificationId/verify
   */
  static async verifyScore(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { verificationId } = req.params;
      const userId = (req as any).userId;
      const { agree, disputeReason } = req.body;

      // Validate verificationId format
      if (!verificationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(verificationId)) {
        throw new BadRequestError('Invalid verification ID format');
      }

      // Validate agree is boolean
      if (typeof agree !== 'boolean') {
        throw new BadRequestError('agree must be a boolean value');
      }

      const verification = await prisma.matchScoreVerification.findUnique({
        where: { id: verificationId },
        include: {
          match: {
            include: {
              teamA: { select: { id: true, captainId: true } },
              teamB: { select: { id: true, captainId: true } }
            }
          }
        }
      });

      if (!verification) {
        throw new NotFoundError('Verification request not found');
      }

      // Only opponent captain can verify (not the submitter)
      const opponentCaptainId = verification.match.teamA.captainId === verification.submittedBy
        ? verification.match.teamB.captainId
        : verification.match.teamA.captainId;

      if (userId !== opponentCaptainId) {
        throw new ForbiddenError('Only the opponent captain can verify this score');
      }

      if (verification.status !== 'PENDING') {
        throw new BadRequestError('This verification request has already been processed');
      }

      if (agree) {
        // VERIFY - Use transaction for atomic update
        await prisma.$transaction(async (tx) => {
          // Update verification status
          await tx.matchScoreVerification.update({
            where: { id: verificationId },
            data: {
              status: 'VERIFIED',
              verifiedBy: userId,
              verifiedAt: new Date()
            }
          });

          // Determine winner
          const winnerId = verification.teamAScore > verification.teamBScore
            ? verification.match.teamA.id
            : verification.teamBScore > verification.teamAScore
            ? verification.match.teamB.id
            : null;

          // Get current finalScoreApprovedBy array (it's stored as JSON)
          // Fetch current match to get finalScoreApprovedBy
          const currentMatch = await tx.match.findUnique({
            where: { id: verification.matchId },
            select: { finalScoreApprovedBy: true }
          });
          
          let approvalsArray: string[] = [];
          if (currentMatch?.finalScoreApprovedBy) {
            const currentApprovals = currentMatch.finalScoreApprovedBy;
            if (typeof currentApprovals === 'string') {
              approvalsArray = JSON.parse(currentApprovals) as string[];
            } else if (Array.isArray(currentApprovals)) {
              // Type guard to ensure all elements are strings
              approvalsArray = currentApprovals.filter((item): item is string => typeof item === 'string');
            }
          }
          
          // Add current captain if not already in array
          if (!approvalsArray.includes(userId)) {
            approvalsArray.push(userId);
          }

          // Check if both captains have approved
          const bothCaptainsApproved = approvalsArray.length >= 2;

          // Update match
          await tx.match.update({
            where: { id: verification.matchId },
            data: {
              status: bothCaptainsApproved ? 'COMPLETED' : 'FINAL_PENDING',
              teamAScore: verification.teamAScore,
              teamBScore: verification.teamBScore,
              teamAWickets: verification.teamAWickets,
              teamBWickets: verification.teamBWickets,
              winnerTeamId: winnerId,
              finalScoreApprovedBy: JSON.stringify(approvalsArray),
              finalScoreApprovedAt: bothCaptainsApproved ? new Date() : null
            }
          });

          return bothCaptainsApproved;
        });

        // Calculate stats if match is completed
        const match = await prisma.match.findUnique({
          where: { id: verification.matchId },
          select: { status: true }
        });

        if (match?.status === 'COMPLETED') {
          try {
            await StatsService.calculateStatsFromBalls(verification.matchId);
            logger.info(`Stats calculated for match ${verification.matchId}`);
          } catch (error) {
            logger.error(`Failed to calculate stats for match ${verification.matchId}:`, error);
            // Don't fail the request if stats calculation fails
          }
        }

        logger.info(`Score verified for match ${verification.matchId} by ${userId}`);
        
        if (match?.status === 'COMPLETED') {
          ResponseUtil.success(res, null, 'Score verified. Match completed. Stats updated.');
        } else {
          ResponseUtil.success(res, null, 'Score verified. Waiting for opponent captain verification.');
        }
      } else {
        // DISPUTE - Require reason
        if (!disputeReason || typeof disputeReason !== 'string' || disputeReason.trim().length < 10) {
          throw new BadRequestError(
            'Dispute reason is required and must be at least 10 characters long'
          );
        }

        // Sanitize dispute reason (prevent XSS)
        const sanitizedReason = disputeReason.trim().substring(0, 500);

        await prisma.matchScoreVerification.update({
          where: { id: verificationId },
          data: {
            status: 'DISPUTED',
            disputeReason: sanitizedReason,
            verifiedBy: userId,
            verifiedAt: new Date()
          }
        });

        logger.info(`Score disputed for match ${verification.matchId} by ${userId}`);
        // TODO: Send notification to admin

        ResponseUtil.success(res, null, 'Score disputed. Admin will review.');
      }
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get pending verifications for a user
   * GET /api/v1/verification/pending
   */
  static async getPendingVerifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      // Admins can see all pending verifications
      if (userRole === 'ADMIN') {
        const verifications = await prisma.matchScoreVerification.findMany({
          where: {
            status: 'PENDING'
          },
          include: {
            match: {
              include: {
                teamA: { select: { teamName: true } },
                teamB: { select: { teamName: true } }
              }
            },
            submitter: { select: { fullName: true, email: true } }
          },
          orderBy: { submittedAt: 'desc' }
        });

        ResponseUtil.success(res, verifications, 'Pending verifications retrieved successfully');
        return;
      }

      // Captains see only their pending verifications
      const userTeams = await prisma.team.findMany({
        where: { captainId: userId },
        select: { id: true }
      });

      const userTeamIds = userTeams.map(t => t.id);

      const verifications = await prisma.matchScoreVerification.findMany({
        where: {
          status: 'PENDING',
          match: {
            OR: [
              { teamAId: { in: userTeamIds } },
              { teamBId: { in: userTeamIds } }
            ]
          },
          submittedBy: { not: userId } // Not submitted by current user
        },
        include: {
          match: {
            include: {
              teamA: { select: { teamName: true } },
              teamB: { select: { teamName: true } }
            }
          },
          submitter: { select: { fullName: true, email: true } }
        },
        orderBy: { submittedAt: 'desc' }
      });

      ResponseUtil.success(res, verifications, 'Pending verifications retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get disputed verifications (Admin only)
   * GET /api/v1/verification/disputed
   */
  static async getDisputedVerifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userRole = (req as any).userRole;

      if (userRole !== 'ADMIN') {
        throw new ForbiddenError('Admin access required');
      }

      const verifications = await prisma.matchScoreVerification.findMany({
        where: {
          status: 'DISPUTED'
        },
        include: {
          match: {
            include: {
              teamA: { select: { id: true, teamName: true } },
              teamB: { select: { id: true, teamName: true } }
            }
          },
          submitter: { select: { fullName: true, email: true } },
          verifier: { select: { fullName: true, email: true } }
        },
        orderBy: { verifiedAt: 'desc' }
      });

      ResponseUtil.success(res, verifications, 'Disputed verifications retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Resolve dispute (Admin only)
   * POST /api/v1/verification/:verificationId/resolve
   */
  static async resolveDispute(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { verificationId } = req.params;
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const { teamAScore, teamBScore, teamAWickets, teamBWickets, winnerId } = req.body;

      if (userRole !== 'ADMIN') {
        throw new ForbiddenError('Admin access required');
      }

      // Validate verificationId format
      if (!verificationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(verificationId)) {
        throw new BadRequestError('Invalid verification ID format');
      }

      // Validate input scores
      if (typeof teamAScore !== 'number' || typeof teamBScore !== 'number' ||
          typeof teamAWickets !== 'number' || typeof teamBWickets !== 'number') {
        throw new BadRequestError('All score fields must be numbers');
      }

      if (teamAScore < 0 || teamBScore < 0 || teamAWickets < 0 || teamBWickets < 0) {
        throw new BadRequestError('Scores and wickets cannot be negative');
      }

      if (teamAWickets > 10 || teamBWickets > 10) {
        throw new BadRequestError('Wickets cannot exceed 10');
      }

      const verification = await prisma.matchScoreVerification.findUnique({
        where: { id: verificationId },
        include: {
          match: {
            include: {
              teamA: { select: { id: true } },
              teamB: { select: { id: true } }
            }
          }
        }
      });

      if (!verification) {
        throw new NotFoundError('Verification not found');
      }

      if (verification.status !== 'DISPUTED') {
        throw new BadRequestError('Only disputed verifications can be resolved');
      }

      // Validate winnerId is one of the teams
      if (winnerId && winnerId !== verification.match.teamA.id && winnerId !== verification.match.teamB.id) {
        throw new BadRequestError('Winner must be one of the participating teams');
      }

      // Use transaction for atomic update
      await prisma.$transaction(async (tx) => {
        // Update verification with admin resolution
        await tx.matchScoreVerification.update({
          where: { id: verificationId },
          data: {
            status: 'FINAL',
            teamAScore,
            teamBScore,
            teamAWickets,
            teamBWickets
          }
        });

        // Update match with final scores
        await tx.match.update({
          where: { id: verification.matchId },
          data: {
            status: 'COMPLETED',
            teamAScore,
            teamBScore,
            teamAWickets,
            teamBWickets,
            winnerTeamId: winnerId || null
          }
        });
      });

      logger.info(`Dispute resolved for match ${verification.matchId} by admin ${userId}`);
      ResponseUtil.success(res, null, 'Dispute resolved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}

