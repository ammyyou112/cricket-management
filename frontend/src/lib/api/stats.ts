import { apiClient, handleApiError } from '../apiClient';
import { PlayerStats } from '../../types/database.types';
import { mockPlayerStats, delay } from '../mockData';

// MOCK MODE: Set to true for frontend testing without backend
const MOCK_MODE = true;

// 1. Get player aggregated statistics
export const getPlayerStats = async (playerId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const stats = mockPlayerStats.filter(s => s.player_id === playerId);
    return handleApiError<PlayerStats[]>(stats, null);
  }

  const { data, error } = await apiClient.get<PlayerStats[]>(`/stats/players/${playerId}`);
  
  return handleApiError<PlayerStats[]>(data, error);
};

// 2. Get team statistics
export const getTeamStats = async (teamId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    return handleApiError({
      totalRuns: 450,
      totalWickets: 25,
      matchesPlayed: 5,
      matchesWon: 3,
    }, null);
  }

  const { data, error } = await apiClient.get(`/stats/teams/${teamId}`);
  
  return handleApiError(data, error);
};

// 3. Get tournament stats
export const getTournamentStats = async (tournamentId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    return handleApiError({
      totalMatches: 10,
      completedMatches: 7,
      totalRuns: 2500,
      totalWickets: 150,
    }, null);
  }

  const { data, error } = await apiClient.get(`/stats/tournaments/${tournamentId}`);
  
  return handleApiError(data, error);
};

// 4. Get leaderboard
export const getLeaderboard = async (type: 'runs' | 'wickets' | 'matches') => {
  if (MOCK_MODE) {
    await delay(300);
    // Simple mock leaderboard
    const leaderboard = mockPlayerStats.map(stat => ({
      player_id: stat.player_id,
      runs_scored: stat.runs_scored || 0,
      wickets_taken: stat.wickets_taken || 0,
    }));
    return handleApiError(leaderboard, null);
  }

  const { data, error } = await apiClient.get(`/stats/leaderboard?type=${type}`);
  
  return handleApiError(data, error);
};

// 5. Get recent form
export const getPlayerForm = async (playerId: string, lastNMatches: number = 5) => {
  if (MOCK_MODE) {
    await delay(300);
    const stats = mockPlayerStats
      .filter(s => s.player_id === playerId)
      .slice(0, lastNMatches);
    return handleApiError(stats, null);
  }

  const { data, error } = await apiClient.get(
    `/stats/players/${playerId}/form?limit=${lastNMatches}`
  );
  
  return handleApiError(data, error);
};
