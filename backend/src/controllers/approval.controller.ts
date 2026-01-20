import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { ResponseUtil } from '@/utils/response';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import logger from '@/utils/logger';

export class ApprovalController {
  /**
   * Request match start approval
   * POST /api/v1/approval/:matchId/request
   */
  static async requestMatchStart(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { matchId } = req.params;
      const userId = (req as any).userId;

      // Validate matchId format (UUID)
      if (!matchId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId)) {
        throw new BadRequestError('Invalid match ID format');
      }

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

      // Only captains of participating teams can request
      if (match.teamA.captainId !== userId && match.teamB.captainId !== userId) {
        throw new ForbiddenError('Only team captains can request match start approval');
      }

      // Validate match status - only SCHEDULED matches can request approval
      if (match.status !== 'SCHEDULED') {
        throw new BadRequestError(
          `Cannot request approval for match with status: ${match.status}. Match must be SCHEDULED.`
        );
      }

      // Check if already approved
      const existingApproval = await prisma.matchStartApproval.findFirst({
        where: {
          matchId,
          status: 'APPROVED'
        }
      });

      if (existingApproval) {
        throw new BadRequestError('Match already approved to start');
      }

      // Use transaction to cancel old pending requests and create new one
      const approval = await prisma.$transaction(async (tx) => {
        // Cancel any existing pending requests (prevent duplicates)
        await tx.matchStartApproval.updateMany({
          where: {
            matchId,
            status: 'PENDING'
          },
          data: {
            status: 'CANCELLED'
          }
        });

        // Create new approval request
        return await tx.matchStartApproval.create({
          data: {
            matchId,
            requestedBy: userId,
            status: 'PENDING'
          },
          include: {
            match: {
              include: {
                teamA: { select: { teamName: true } },
                teamB: { select: { teamName: true } }
              }
            },
            requester: { select: { fullName: true, email: true } }
          }
        });
      });

      logger.info(`Match start approval requested for match ${matchId} by ${userId}`);

      // TODO: Send notification to opponent captain
      // const opponentCaptainId = match.teamA.captainId === userId 
      //   ? match.teamB.captainId 
      //   : match.teamA.captainId;

      ResponseUtil.created(
        res,
        approval,
        'Approval request sent to opponent captain'
      );
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Respond to approval request
   * POST /api/v1/approval/:approvalId/respond
   */
  static async respondToApproval(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { approvalId } = req.params;
      const userId = (req as any).userId;
      const { approve } = req.body;

      // Validate approvalId format
      if (!approvalId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(approvalId)) {
        throw new BadRequestError('Invalid approval ID format');
      }

      // Validate approve is boolean
      if (typeof approve !== 'boolean') {
        throw new BadRequestError('approve must be a boolean value');
      }

      const approval = await prisma.matchStartApproval.findUnique({
        where: { id: approvalId },
        include: {
          match: {
            include: {
              teamA: { select: { captainId: true } },
              teamB: { select: { captainId: true } }
            }
          }
        }
      });

      if (!approval) {
        throw new NotFoundError('Approval request not found');
      }

      // Only opponent captain can respond (not the requester)
      const opponentCaptainId = approval.match.teamA.captainId === approval.requestedBy
        ? approval.match.teamB.captainId
        : approval.match.teamA.captainId;

      if (userId !== opponentCaptainId) {
        throw new ForbiddenError('Only the opponent captain can respond to this approval');
      }

      if (approval.status !== 'PENDING') {
        throw new BadRequestError('This approval request has already been processed');
      }

      // Check match is still in valid state
      if (approval.match.status === 'COMPLETED' || approval.match.status === 'CANCELLED') {
        throw new BadRequestError(`Cannot respond to approval for match with status: ${approval.match.status}`);
      }

      const status = approve ? 'APPROVED' : 'REJECTED';

      // Use transaction for atomic update
      await prisma.$transaction(async (tx) => {
        // Update approval
        await tx.matchStartApproval.update({
          where: { id: approvalId },
          data: {
            status,
            approvedBy: userId,
            respondedAt: new Date()
          }
        });

        // If approved, update match status
        if (approve) {
          await tx.match.update({
            where: { id: approval.matchId },
            data: {
              status: 'LIVE'
            }
          });
        }
      });

      if (approve) {
        logger.info(`Match start approved for match ${approval.matchId} by ${userId}`);
        ResponseUtil.success(res, null, 'Match approved to start');
      } else {
        logger.info(`Match start rejected for match ${approval.matchId} by ${userId}`);
        ResponseUtil.success(res, null, 'Match start rejected');
      }
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get pending approvals for a user
   * GET /api/v1/approval/pending
   */
  static async getPendingApprovals(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;

      // Get matches where user is captain of opponent team
      const userTeams = await prisma.team.findMany({
        where: { captainId: userId },
        select: { id: true }
      });

      const userTeamIds = userTeams.map(t => t.id);

      const approvals = await prisma.matchStartApproval.findMany({
        where: {
          status: 'PENDING',
          match: {
            OR: [
              { teamAId: { in: userTeamIds } },
              { teamBId: { in: userTeamIds } }
            ]
          },
          requestedBy: { not: userId } // Not requested by current user
        },
        include: {
          match: {
            include: {
              teamA: { select: { teamName: true } },
              teamB: { select: { teamName: true } }
            }
          },
          requester: { select: { fullName: true, email: true } }
        },
        orderBy: { requestedAt: 'desc' }
      });

      ResponseUtil.success(res, approvals, 'Pending approvals retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}

