import { prisma } from '@/config/database';
import { AuditAction, ApprovalType } from '@prisma/client';

interface LogActionInput {
  matchId?: string;
  action: AuditAction;
  performedBy: string;
  previousState?: any;
  newState?: any;
  approvalType?: ApprovalType;
  wasAutoApproved?: boolean;
  ballNumber?: number;
  overNumber?: number;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Log an action to audit trail
   */
  static async logAction(input: LogActionInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          matchId: input.matchId,
          action: input.action,
          performedBy: input.performedBy,
          previousState: input.previousState ? JSON.parse(JSON.stringify(input.previousState)) : null,
          newState: input.newState ? JSON.parse(JSON.stringify(input.newState)) : null,
          approvalType: input.approvalType,
          wasAutoApproved: input.wasAutoApproved,
          ballNumber: input.ballNumber,
          overNumber: input.overNumber,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent
        }
      });
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Get audit logs for a match
   */
  static async getMatchAuditLogs(matchId: string, limit: number = 100) {
    return await prisma.auditLog.findMany({
      where: { matchId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { performedAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get audit logs by action
   */
  static async getAuditLogsByAction(action: AuditAction, limit: number = 100) {
    return await prisma.auditLog.findMany({
      where: { action },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        match: {
          select: {
            id: true,
            teamA: { select: { teamName: true } },
            teamB: { select: { teamName: true } }
          }
        }
      },
      orderBy: { performedAt: 'desc' },
      take: limit
    });
  }
}

export const auditService = AuditService;

