import { apiClient } from '../lib/apiClient';

export type AuditAction =
  | 'MATCH_CREATED'
  | 'STATUS_CHANGED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_GRANTED'
  | 'APPROVAL_REJECTED'
  | 'APPROVAL_AUTO_APPROVED'
  | 'BALL_ENTERED'
  | 'BALL_DELETED'
  | 'BALL_MODIFIED'
  | 'INNINGS_ENDED'
  | 'STATS_CALCULATED'
  | 'STATS_UPDATED'
  | 'TIMEOUT_ENABLED'
  | 'TIMEOUT_DISABLED';

export interface AuditLog {
  id: string;
  matchId?: string;
  action: AuditAction;
  performedBy: string;
  performedAt: string;
  previousState?: any;
  newState?: any;
  approvalType?: 'START_SCORING' | 'START_SECOND_INNINGS' | 'FINAL_SCORE';
  wasAutoApproved?: boolean;
  ballNumber?: number;
  overNumber?: number;
  ipAddress?: string;
  userAgent?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  match?: {
    id: string;
    teamA: { teamName: string };
    teamB: { teamName: string };
  };
}

class AuditService {
  /**
   * Get match audit logs
   */
  async getMatchAuditLogs(matchId: string, limit: number = 100): Promise<AuditLog[]> {
    const { data, error } = await apiClient.get<AuditLog[]>(`/audit/match/${matchId}?limit=${limit}`);
    if (error) throw new Error(error);
    return data || [];
  }

  /**
   * Get score history (ball-by-ball)
   */
  async getScoreHistory(matchId: string, innings?: number): Promise<AuditLog[]> {
    const query = innings ? `?innings=${innings}` : '';
    const { data, error } = await apiClient.get<AuditLog[]>(`/audit/match/${matchId}/score-history${query}`);
    if (error) throw new Error(error);
    return data || [];
  }

  /**
   * Get audit logs by action (admin only)
   */
  async getAuditLogsByAction(action: AuditAction, limit: number = 100): Promise<AuditLog[]> {
    const { data, error } = await apiClient.get<AuditLog[]>(`/audit/action/${action}?limit=${limit}`);
    if (error) throw new Error(error);
    return data || [];
  }
}

export const auditService = new AuditService();

