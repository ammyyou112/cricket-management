import { apiClient } from '../lib/apiClient';

export interface BallInput {
  innings: number;
  overNumber: number;
  ballNumber: number;
  batsmanOnStrike: string;
  batsmanNonStrike: string;
  bowler: string;
  runs: number;
  isWicket?: boolean;
  wicketType?: 'BOWLED' | 'CAUGHT' | 'LBW' | 'RUN_OUT' | 'STUMPED' | 'HIT_WICKET';
  dismissedPlayer?: string;
  fielder?: string;
  isWide?: boolean;
  isNoBall?: boolean;
  isBye?: boolean;
  isLegBye?: boolean;
}

export interface Ball {
  id: string;
  matchId: string;
  innings: number;
  overNumber: number;
  ballNumber: number;
  batsmanOnStrike: string;
  batsmanNonStrike: string;
  bowler: string;
  runs: number;
  isWicket: boolean;
  wicketType?: string;
  dismissedPlayer?: string;
  fielder?: string;
  isWide: boolean;
  isNoBall: boolean;
  isBye: boolean;
  isLegBye: boolean;
  timestamp: string;
  enteredBy: string;
  striker?: { id: string; fullName: string };
  nonStriker?: { id: string; fullName: string };
  bowlerUser?: { id: string; fullName: string };
  enteredByUser?: { id: string; fullName: string };
}

export interface OverSummary {
  overNumber: number;
  innings: number;
  balls: Ball[];
  runs: number;
  wickets: number;
  legalBalls: number;
  isComplete: boolean;
}

export interface ScoringData {
  match: {
    id: string;
    teamA: {
      id: string;
      name: string;
      captainId: string;
      captainName: string;
      score: { runs: number; wickets: number; overs: number };
    };
    teamB: {
      id: string;
      name: string;
      captainId: string;
      captainName: string;
      score: { runs: number; wickets: number; overs: number };
    };
    venue: string;
    matchDate: string;
    status: string;
    currentInnings: number;
    battingTeam: { id: string; name: string };
    bowlingTeam: { id: string; name: string };
  };
  players: {
    batting: Array<{ id: string; name: string; type: string | null }>;
    bowling: Array<{ id: string; name: string; type: string | null }>;
  };
  balls: Ball[];
  currentOver: Ball[];
  currentOverNumber: number;
  isAuthorized: boolean;
}

class BallByBallService {
  /**
   * Get comprehensive scoring data for a match
   */
  async getScoringData(matchId: string): Promise<ScoringData> {
    try {
      const { data, error } = await apiClient.get<ScoringData>(`/balls/${matchId}/data`);
      if (error) throw new Error(error);
      if (!data) throw new Error('Failed to get scoring data');
      return data;
    } catch (error: any) {
      console.warn('Error fetching scoring data (returning empty):', error);
      throw error;
    }
  }

  /**
   * Enter a ball
   */
  async enterBall(matchId: string, ballData: BallInput): Promise<Ball> {
    const { data, error } = await apiClient.post<Ball>(`/balls/${matchId}`, ballData);
    if (error) throw new Error(error);
    if (!data) throw new Error('Failed to enter ball');
    return data;
  }

  /**
   * Undo last ball
   */
  async undoLastBall(matchId: string, innings?: number): Promise<void> {
    const query = innings ? `?innings=${innings}` : '';
    const { error } = await apiClient.delete(`/balls/${matchId}/last${query}`);
    if (error) throw new Error(error);
  }

  /**
   * Get all balls for a match
   */
  async getBallsByMatch(matchId: string, innings?: number, overNumber?: number): Promise<Ball[]> {
    try {
      const params = new URLSearchParams();
      if (innings) params.append('innings', innings.toString());
      if (overNumber) params.append('overNumber', overNumber.toString());
      const query = params.toString() ? `?${params.toString()}` : '';
      
      const { data, error } = await apiClient.get<Ball[]>(`/balls/${matchId}${query}`);
      
      // If there's an error, check if it's a 500 (server error) or 404 (not found)
      // In both cases, return empty array instead of throwing
      if (error) {
        console.warn('Error fetching balls (returning empty array):', error);
        return [];
      }
      
      return data || [];
    } catch (error: any) {
      // Catch any unexpected errors and return empty array
      console.warn('Exception fetching balls (returning empty array):', error);
      return [];
    }
  }

  /**
   * Get over summary
   */
  async getOverSummary(matchId: string, innings: number, overNumber: number): Promise<OverSummary> {
    const { data, error } = await apiClient.get<OverSummary>(`/balls/${matchId}/over/${innings}/${overNumber}`);
    if (error) throw new Error(error);
    if (!data) throw new Error('Failed to get over summary');
    return data;
  }
}

export const ballByBallService = new BallByBallService();

