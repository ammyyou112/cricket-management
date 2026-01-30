import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { ResponseUtil } from '@/utils/response';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import logger from '@/utils/logger';
import { ApprovalType, ApprovalStatus, MatchStatus, AuditAction } from '@prisma/client';
import { auditService } from '@/services/audit.service';
import { settingsService } from '@/services/settings.service';
import { StatsService } from '@/services/stats.service';

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

  /**
   * Request approval (unified - supports all 3 approval types)
   * POST /api/v1/approval/:matchId/request-new
   */
  static async requestApproval(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { matchId } = req.params;
      const userId = (req as any).userId;
      const { type } = req.body;

      // Validate matchId
      if (!matchId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId)) {
        throw new BadRequestError('Invalid match ID format');
      }

      // Validate approval type
      if (!type || !['START_SCORING', 'START_SECOND_INNINGS', 'FINAL_SCORE'].includes(type)) {
        throw new BadRequestError('Invalid approval type. Must be START_SCORING, START_SECOND_INNINGS, or FINAL_SCORE');
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

      // Only captains can request
      if (match.teamA.captainId !== userId && match.teamB.captainId !== userId) {
        throw new ForbiddenError('Only team captains can request approval');
      }

      // Validate match status based on approval type
      let requiredStatus: MatchStatus;
      let nextStatus: MatchStatus;

      switch (type) {
        case 'START_SCORING':
          requiredStatus = MatchStatus.SCHEDULED;
          nextStatus = MatchStatus.FIRST_INNINGS;
          break;
        case 'START_SECOND_INNINGS':
          requiredStatus = MatchStatus.FIRST_INNINGS;
          nextStatus = MatchStatus.SECOND_INNINGS;
          break;
        case 'FINAL_SCORE':
          requiredStatus = MatchStatus.SECOND_INNINGS;
          nextStatus = MatchStatus.COMPLETED;
          break;
        default:
          throw new BadRequestError('Invalid approval type');
      }

      if (match.status !== requiredStatus) {
        throw new BadRequestError(
          `Cannot request ${type} approval. Match status must be ${requiredStatus}. Current: ${match.status}`
        );
      }

      // Get captain settings for timeout
      const requesterSettings = await settingsService.getSettings(userId);
      const timeoutMinutes = requesterSettings?.timeoutMinutes || 5;
      const autoApproveEnabled = requesterSettings?.autoApproveEnabled ?? true;

      const autoApproveAt = new Date();
      autoApproveAt.setMinutes(autoApproveAt.getMinutes() + timeoutMinutes);

      // Use transaction
      const approval = await prisma.$transaction(async (tx) => {
        // Cancel old pending requests of same type
        await tx.approvalRequest.updateMany({
          where: {
            matchId,
            type: type as ApprovalType,
            status: ApprovalStatus.PENDING
          },
          data: {
            status: ApprovalStatus.CANCELLED
          }
        });

        // Create new approval request
        const newApproval = await tx.approvalRequest.create({
          data: {
            matchId,
            type: type as ApprovalType,
            requestedBy: userId,
            status: ApprovalStatus.PENDING,
            autoApproveAt,
            autoApproveEnabled,
            wasAutoApproved: false
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

        // Update match status to pending state
        let pendingStatus: MatchStatus;
        if (type === 'START_SCORING') {
          pendingStatus = MatchStatus.SCORING_PENDING;
        } else if (type === 'START_SECOND_INNINGS') {
          pendingStatus = MatchStatus.SECOND_INNINGS_PENDING;
        } else {
          pendingStatus = MatchStatus.FINAL_PENDING;
        }

        await tx.match.update({
          where: { id: matchId },
          data: { status: pendingStatus }
        });

        return newApproval;
      });

      // Create audit log
      await auditService.logAction({
        matchId,
        action: AuditAction.APPROVAL_REQUESTED,
        performedBy: userId,
        approvalType: type as ApprovalType,
        newState: {
          type,
          status: 'PENDING',
          autoApproveAt: autoApproveAt.toISOString()
        }
      });

      logger.info(`Approval requested for match ${matchId} by ${userId}: ${type}`);

      // TODO: Send notification to opponent captain

      ResponseUtil.created(res, approval, 'Approval request sent to opponent captain');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Respond to approval request (unified)
   * POST /api/v1/approval/:approvalId/respond-new
   */
  static async respondToApprovalNew(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { approvalId } = req.params;
      const userId = (req as any).userId;
      const { approve } = req.body;

      // Validate approvalId
      if (!approvalId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(approvalId)) {
        throw new BadRequestError('Invalid approval ID format');
      }

      if (typeof approve !== 'boolean') {
        throw new BadRequestError('approve must be a boolean value');
      }

      const approval = await prisma.approvalRequest.findUnique({
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

      // Only opponent captain can respond
      const opponentCaptainId = approval.match.teamA.captainId === approval.requestedBy
        ? approval.match.teamB.captainId
        : approval.match.teamA.captainId;

      if (userId !== opponentCaptainId) {
        throw new ForbiddenError('Only the opponent captain can respond to this approval');
      }

      if (approval.status !== ApprovalStatus.PENDING) {
        throw new BadRequestError('This approval request has already been processed');
      }

      // Determine next status based on approval type
      let nextStatus: MatchStatus;
      let isFinalScore = false;
      let approvalsArray: string[] = [];
      
      switch (approval.type) {
        case ApprovalType.START_SCORING:
          nextStatus = MatchStatus.FIRST_INNINGS;
          break;
        case ApprovalType.START_SECOND_INNINGS:
          nextStatus = MatchStatus.SECOND_INNINGS;
          break;
        case ApprovalType.FINAL_SCORE:
          // For final score, check if both captains have approved
          // Get current match to check finalScoreApprovedBy
          const currentMatch = await prisma.match.findUnique({
            where: { id: approval.matchId },
            select: { finalScoreApprovedBy: true, teamAId: true, teamBId: true }
          });
          
          if (currentMatch?.finalScoreApprovedBy) {
            const currentApprovals = currentMatch.finalScoreApprovedBy;
            if (typeof currentApprovals === 'string') {
              approvalsArray = JSON.parse(currentApprovals) as string[];
            } else if (Array.isArray(currentApprovals)) {
              // Type guard to ensure all elements are strings
              approvalsArray = currentApprovals.filter((item): item is string => typeof item === 'string');
            }
          }
          
          // Add current approver
          if (!approvalsArray.includes(userId)) {
            approvalsArray.push(userId);
          }
          
          // Add requester (they approved by submitting)
          if (!approvalsArray.includes(approval.requestedBy)) {
            approvalsArray.push(approval.requestedBy);
          }
          
          // Check if both captains have approved
          const bothCaptainsApproved = approvalsArray.length >= 2;
          nextStatus = bothCaptainsApproved ? MatchStatus.COMPLETED : MatchStatus.FINAL_PENDING;
          isFinalScore = true;
          break;
        default:
          throw new BadRequestError('Invalid approval type');
      }

      const status = approve ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

      // Use transaction
      await prisma.$transaction(async (tx) => {
        // Update approval
        await tx.approvalRequest.update({
          where: { id: approvalId },
          data: {
            status,
            approvedBy: userId,
            approvedAt: new Date(),
            wasAutoApproved: false
          }
        });

        if (approve) {
          // Update match status
          await tx.match.update({
            where: { id: approval.matchId },
            data: {
              status: nextStatus,
              // Update approval tracking fields
              ...(approval.type === ApprovalType.START_SCORING && {
                scoringStartApprovedBy: userId,
                scoringStartApprovedAt: new Date()
              }),
              ...(approval.type === ApprovalType.START_SECOND_INNINGS && {
                secondInningsApprovedBy: userId,
                secondInningsApprovedAt: new Date(),
                firstInningsComplete: true
              }),
              ...(isFinalScore && {
                secondInningsComplete: true,
                finalScoreApprovedAt: nextStatus === MatchStatus.COMPLETED ? new Date() : null,
                // Update finalScoreApprovedBy JSON array (handled above in switch)
                finalScoreApprovedBy: JSON.stringify(approvalsArray)
              })
            }
          });
        } else {
          // Revert match status on rejection
          let revertStatus: MatchStatus;
          switch (approval.type) {
            case ApprovalType.START_SCORING:
              revertStatus = MatchStatus.SCHEDULED;
              break;
            case ApprovalType.START_SECOND_INNINGS:
              revertStatus = MatchStatus.FIRST_INNINGS;
              break;
            case ApprovalType.FINAL_SCORE:
              revertStatus = MatchStatus.SECOND_INNINGS;
              break;
            default:
              revertStatus = MatchStatus.SCHEDULED;
          }

          await tx.match.update({
            where: { id: approval.matchId },
            data: { status: revertStatus }
          });
        }
      });

      // Create audit log
      await auditService.logAction({
        matchId: approval.matchId,
        action: approve ? AuditAction.APPROVAL_GRANTED : AuditAction.APPROVAL_REJECTED,
        performedBy: userId,
        approvalType: approval.type,
        wasAutoApproved: false,
        newState: {
          status: approve ? 'APPROVED' : 'REJECTED',
          nextStatus: approve ? nextStatus : null
        }
      });

      // Calculate stats if match is completed
      if (approve && nextStatus === MatchStatus.COMPLETED) {
        try {
          await StatsService.calculateStatsFromBalls(approval.matchId);
          logger.info(`Stats calculated for match ${approval.matchId}`);
        } catch (error) {
          logger.error(`Failed to calculate stats for match ${approval.matchId}:`, error);
          // Don't fail the request if stats calculation fails
        }
      }

      if (approve) {
        logger.info(`Approval granted for match ${approval.matchId} by ${userId}: ${approval.type}`);
        if (nextStatus === MatchStatus.COMPLETED) {
          ResponseUtil.success(res, null, 'Approval granted. Match completed. Stats updated.');
        } else {
          ResponseUtil.success(res, null, 'Approval granted');
        }
      } else {
        logger.info(`Approval rejected for match ${approval.matchId} by ${userId}: ${approval.type}`);
        ResponseUtil.success(res, null, 'Approval rejected');
      }
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get pending approvals (unified)
   * GET /api/v1/approval/pending-new
   */
  static async getPendingApprovalsNew(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;

      // Get teams where user is captain
      const userTeams = await prisma.team.findMany({
        where: { captainId: userId },
        select: { id: true, captainId: true }
      });

      if (userTeams.length === 0) {
        ResponseUtil.success(res, [], 'No pending approvals');
        return;
      }

      const userTeamIds = userTeams.map(t => t.id);

      // Get approvals where:
      // 1. Status is PENDING
      // 2. Match involves one of user's teams
      // 3. User is NOT the requester (user is the opponent captain who needs to approve)
      const approvals = await prisma.approvalRequest.findMany({
        where: {
          status: ApprovalStatus.PENDING,
          match: {
            OR: [
              { teamAId: { in: userTeamIds } },
              { teamBId: { in: userTeamIds } }
            ]
          },
          requestedBy: { not: userId }
        },
        include: {
          match: {
            include: {
              teamA: { select: { id: true, teamName: true, captainId: true } },
              teamB: { select: { id: true, teamName: true, captainId: true } }
            }
          },
          requester: { select: { id: true, fullName: true, email: true } }
        },
        orderBy: { requestedAt: 'desc' }
      });

      // Filter to ensure user is the opponent captain (not the requester)
      const filteredApprovals = approvals.filter(approval => {
        const match = approval.match;
        const isTeamACaptain = match.teamA.captainId === userId;
        const isTeamBCaptain = match.teamB.captainId === userId;
        const isRequester = approval.requestedBy === userId;
        
        // User must be a captain of one of the teams AND not be the requester
        return (isTeamACaptain || isTeamBCaptain) && !isRequester;
      });

      ResponseUtil.success(res, filteredApprovals, 'Pending approvals retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}

