import { apiClient } from '../lib/apiClient';

export interface StartScoringResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface UpdateScoreData {
  currentInning?: number;
  teamAScore?: number;
  teamAWickets?: number;
  teamAOvers?: number;
  teamBScore?: number;
  teamBWickets?: number;
  teamBOvers?: number;
}

export interface EndScoringData {
  winnerId?: string;
}

class ScoringService {
  async startScoring(matchId: string): Promise<StartScoringResponse> {
    const { data, error } = await apiClient.post(`/scoring/${matchId}/start`);
    if (error) throw error;
    return data;
  }

  async updateScore(matchId: string, scoreData: UpdateScoreData): Promise<any> {
    const { data, error } = await apiClient.patch(`/scoring/${matchId}/update`, scoreData);
    if (error) throw error;
    return data;
  }

  async endScoring(matchId: string, winnerId?: string): Promise<any> {
    const { data, error } = await apiClient.post(`/scoring/${matchId}/end`, { winnerId });
    if (error) throw error;
    return data;
  }

  async getLiveScore(matchId: string): Promise<any> {
    const { data, error } = await apiClient.get(`/scoring/${matchId}/live`);
    if (error) throw error;
    return data;
  }
}

export const scoringService = new ScoringService();

