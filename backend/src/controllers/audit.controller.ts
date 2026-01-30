import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '@/utils/response';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/utils/errors';
import { auditService } from '@/services/audit.service';
import { prisma } from '@/config/database';
import { AuditAction } from '@prisma/client';

export class AuditController {
  /**
   * Get match audit logs
   * GET /api/v1/audit/match/:matchId
   */
  static async getMatchAuditLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { matchId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      if (!matchId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId)) {
        throw new BadRequestError('Invalid match ID format');
      }

      // Verify match exists
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { id: true }
      });

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      const logs = await auditService.getMatchAuditLogs(matchId, limit);

      ResponseUtil.success(res, logs, 'Audit logs retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get audit logs by action
   * GET /api/v1/audit/action/:action
   */
  static async getAuditLogsByAction(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { action } = req.params;
      const userRole = (req as any).userRole;
      const limit = parseInt(req.query.limit as string) || 100;

      // Only admins can view all audit logs by action
      if (userRole !== 'ADMIN') {
        throw new ForbiddenError('Admin access required');
      }

      // Validate action
      if (!Object.values(AuditAction).includes(action as AuditAction)) {
        throw new BadRequestError('Invalid audit action');
      }

      const logs = await auditService.getAuditLogsByAction(action as AuditAction, limit);

      ResponseUtil.success(res, logs, 'Audit logs retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get score history (ball-by-ball)
   * GET /api/v1/audit/match/:matchId/score-history
   */
  static async getScoreHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { matchId } = req.params;
      const { innings } = req.query;

      if (!matchId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId)) {
        throw new BadRequestError('Invalid match ID format');
      }

      const whereClause: any = {
        matchId,
        action: AuditAction.BALL_ENTERED
      };

      if (innings) {
        whereClause.ballNumber = { not: null };
        // We'll filter by innings in the query result since it's in newState JSON
      }

      const logs = await prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              fullName: true
            }
          }
        },
        orderBy: { performedAt: 'asc' }
      });

      // Filter by innings if specified
      let filteredLogs = logs;
      if (innings) {
        filteredLogs = logs.filter(log => {
          const newState = log.newState as any;
          return newState && newState.innings === parseInt(innings as string);
        });
      }

      ResponseUtil.success(res, filteredLogs, 'Score history retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}

