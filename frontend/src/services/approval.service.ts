import { apiClient } from '../lib/apiClient';

export type ApprovalType = 'START_SCORING' | 'START_SECOND_INNINGS' | 'FINAL_SCORE';

export interface ApprovalRequest {
  id: string;
  matchId: string;
  type: ApprovalType;
  requestedBy: string;
  approvedBy?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_APPROVED' | 'EXPIRED' | 'CANCELLED';
  requestedAt: string;
  approvedAt?: string;
  autoApproveAt: string;
  autoApproveEnabled: boolean;
  wasAutoApproved: boolean;
  match?: {
    id: string;
    teamA: { teamName: string };
    teamB: { teamName: string };
  };
  requester?: {
    fullName: string;
    email: string;
  };
}

class ApprovalService {
  // Legacy endpoints (kept for backward compatibility)
  async requestMatchStart(matchId: string): Promise<any> {
    const { data, error } = await apiClient.post(`/approval/${matchId}/request`);
    if (error) throw error;
    return data;
  }

  async respondToApproval(approvalId: string, approve: boolean): Promise<any> {
    const { data, error } = await apiClient.post(`/approval/${approvalId}/respond`, { approve });
    if (error) throw error;
    return data;
  }

  async getPendingApprovals(): Promise<any> {
    const { data, error } = await apiClient.get('/approval/pending');
    if (error) throw error;
    return data;
  }

  // New unified approval endpoints
  async requestApproval(matchId: string, type: ApprovalType): Promise<ApprovalRequest> {
    const { data, error } = await apiClient.post<ApprovalRequest>(`/approval/${matchId}/request-new`, { type });
    if (error) throw new Error(error);
    if (!data) throw new Error('Failed to request approval');
    return data;
  }

  async respondToApprovalNew(approvalId: string, approve: boolean): Promise<void> {
    const { error } = await apiClient.post(`/approval/${approvalId}/respond-new`, { approve });
    if (error) throw new Error(error);
  }

  async getPendingApprovalsNew(): Promise<ApprovalRequest[]> {
    const { data, error } = await apiClient.get<ApprovalRequest[]>('/approval/pending-new');
    if (error) throw new Error(error);
    return data || [];
  }
}

export const approvalService = new ApprovalService();

