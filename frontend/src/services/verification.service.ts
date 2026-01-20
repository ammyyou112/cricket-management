import { apiClient } from '../lib/apiClient';

export interface SubmitScoreData {
  teamAScore: number;
  teamBScore: number;
  teamAWickets: number;
  teamBWickets: number;
}

export interface VerifyScoreData {
  agree: boolean;
  disputeReason?: string;
}

class VerificationService {
  async submitScore(matchId: string, scoreData: SubmitScoreData): Promise<any> {
    const { data, error } = await apiClient.post(`/verification/${matchId}/submit`, scoreData);
    if (error) throw error;
    return data;
  }

  async verifyScore(verificationId: string, verifyData: VerifyScoreData): Promise<any> {
    const { data, error } = await apiClient.post(`/verification/${verificationId}/verify`, verifyData);
    if (error) throw error;
    return data;
  }

  async getPendingVerifications(): Promise<any> {
    const { data, error } = await apiClient.get('/verification/pending');
    if (error) throw error;
    return data;
  }
}

export const verificationService = new VerificationService();

