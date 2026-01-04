import { apiClient, handleApiError } from '../apiClient';
import { User, PlayerStats } from '../../types/database.types';
import { mockUsers, mockPlayerStats, mockMatches, delay } from '../mockData';

// MOCK MODE: Set to true for frontend testing without backend
const MOCK_MODE = false;

/**
 * Get player profile details by user ID.
 * @param userId - The ID of the user (player).
 * @returns User profile data or an error.
 */
export const getPlayerProfile = async (userId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const player = mockUsers.find(u => u.id === userId) || mockUsers[0];
    return handleApiError<User>(player, null);
  }

  const { data, error } = await apiClient.get<any>(`/users/${userId}`);
  
  if (error) {
    return handleApiError<User>(null, error);
  }
  
  // Transform backend format (camelCase) to frontend format (snake_case)
  if (data) {
    const roleMap: Record<string, string> = {
      'PLAYER': 'player',
      'CAPTAIN': 'captain',
      'ADMIN': 'admin',
    };
    
    const playerTypeMap: Record<string, string> = {
      'BATSMAN': 'batsman',
      'BOWLER': 'bowler',
      'ALL_ROUNDER': 'all-rounder',
      'WICKET_KEEPER': 'wicket-keeper',
    };
    
    const transformedUser: User = {
      id: data.id,
      email: data.email,
      full_name: data.fullName || data.full_name || '',
      role: roleMap[data.role] || data.role?.toLowerCase() || 'player',
      profile_picture: data.profilePictureUrl || data.profile_picture,
      phone: data.phone,
      player_type: data.playerType ? playerTypeMap[data.playerType] || data.playerType.toLowerCase().replace('_', '-') : undefined,
      created_at: data.createdAt || data.created_at,
    };
    
    return handleApiError<User>(transformedUser, null);
  }
  
  return handleApiError<User>(null, error || 'No data received');
};

/**
 * Update player profile information.
 * @param userId - The ID of the user to update.
 * @param data - The partial data to update.
 * @returns Updated user profile or an error.
 */
export const updatePlayerProfile = async (userId: string, data: Partial<User>) => {
  if (MOCK_MODE) {
    await delay(500);
    const player = mockUsers.find(u => u.id === userId) || mockUsers[0];
    const updated = { ...player, ...data };
    return handleApiError<User>(updated, null);
  }

  const { data: updatedData, error } = await apiClient.patch<User>(`/users/${userId}`, data);
  
  return handleApiError<User>(updatedData, error);
};

/**
 * Get aggregated player statistics.
 * @param userId - The ID of the player.
 * @returns List of stats records or an error.
 */
export const getPlayerStats = async (userId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const stats = mockPlayerStats
      .filter(s => s.player_id === userId)
      .map(stat => ({
        ...stat,
        matches: mockMatches.find(m => m.id === stat.match_id),
      }));
    return handleApiError<PlayerStats[]>(stats as any, null);
  }

  const { data, error } = await apiClient.get<PlayerStats[]>(`/users/${userId}/stats`);
  
  return handleApiError<PlayerStats[]>(data, error);
};

/**
 * Get player statistics summary (aggregated stats)
 * @param userId - The ID of the player.
 * @returns Summary statistics or an error.
 */
export const getPlayerStatsSummary = async (userId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const stats = mockPlayerStats.filter(s => s.player_id === userId);
    const summary = {
      totalMatches: stats.length,
      totalRuns: stats.reduce((sum, s) => sum + (s.runs_scored || 0), 0),
      totalWickets: stats.reduce((sum, s) => sum + (s.wickets_taken || 0), 0),
      totalCatches: stats.reduce((sum, s) => sum + (s.catches || 0), 0),
      battingAverage: stats.length > 0 ? stats.reduce((sum, s) => sum + (s.runs_scored || 0), 0) / stats.length : 0,
      highestScore: Math.max(...stats.map(s => s.runs_scored || 0), 0),
      bestBowling: '0/0',
      strikeRate: 0,
      economyRate: 0,
      fifties: 0,
      hundreds: 0,
      threePlusWickets: 0,
    };
    return handleApiError(summary, null);
  }

  const { data, error } = await apiClient.get(`/users/${userId}/stats/summary`);
  
  return handleApiError(data, error);
};

/**
 * Get partial match history for a player.
 * @param userId - The player's ID.
 * @returns List of matches the player has participated in.
 */
export const getPlayerMatchHistory = async (userId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const playerStats = mockPlayerStats.filter(s => s.player_id === userId);
    const matches = playerStats.map(stat => ({
      match_id: stat.match_id,
      runs_scored: stat.runs_scored,
      wickets_taken: stat.wickets_taken,
      catches: stat.catches,
      matches: mockMatches.find(m => m.id === stat.match_id),
    }));
    return handleApiError(matches, null);
  }

  const { data, error } = await apiClient.get(`/users/${userId}/matches`);
  
  return handleApiError(data, error);
};

/**
 * Get all registered players.
 * Filters users by role 'player'.
 * @returns List of all players.
 */
export const getAllPlayers = async () => {
  if (MOCK_MODE) {
    await delay(300);
    const players = mockUsers.filter(u => u.role === 'player');
    return handleApiError<User[]>(players, null);
  }

  const { data, error } = await apiClient.get<User[]>('/players');
  
  return handleApiError<User[]>(data, error);
};

/**
 * Search players by name.
 * @param query - The search string.
 * @returns List of matching players.
 */
export const searchPlayers = async (query: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const players = mockUsers
      .filter(u => u.role === 'player' && u.full_name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10);
    return handleApiError<User[]>(players, null);
  }

  const { data, error } = await apiClient.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
  
  return handleApiError<User[]>(data, error);
};
