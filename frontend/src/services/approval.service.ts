import { apiClient } from '../lib/apiClient';

class ApprovalService {
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
}

export const approvalService = new ApprovalService();

