/**
 * Cricket 360 - Match Service
 * Handles all match-related API calls
 */

import { apiClient } from '@/lib/apiClient';
import { Match, CreateMatchInput, UpdateMatchScoreInput, AddPlayerStatInput, PaginatedResponse } from '@/types/api.types';

export interface GetMatchesParams {
  tournamentId?: string;
  teamId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const matchService = {
  /**
   * Get all matches with pagination and filters
   */
  getAll: async (params?: GetMatchesParams) => {
    const queryParams = new URLSearchParams();
    if (params?.tournamentId) queryParams.append('tournamentId', params.tournamentId);
    if (params?.teamId) queryParams.append('teamId', params.teamId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/matches${queryString ? `?${queryString}` : ''}`;

    const { data, error } = await apiClient.get<PaginatedResponse<Match>>(endpoint);
    
    if (error) {
      throw new Error(error);
    }

    return data;
  },

  /**
   * Get match by ID
   */
  getById: async (id: string) => {
    const { data, error } = await apiClient.get<Match>(`/matches/${id}`);
    
    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error('Match not found');
    }

    return data;
  },

  /**
   * Create a new match
   */
  create: async (data: CreateMatchInput) => {
    const { data: match, error } = await apiClient.post<Match>('/matches', data);
    
    if (error) {
      throw new Error(error);
    }

    if (!match) {
      throw new Error('Match creation failed');
    }

    return match;
  },

  /**
   * Update match score
   */
  updateScore: async (id: string, scoreData: UpdateMatchScoreInput) => {
    const { data: match, error } = await apiClient.post<Match>(`/matches/${id}/score`, scoreData);
    
    if (error) {
      throw new Error(error);
    }

    if (!match) {
      throw new Error('Score update failed');
    }

    return match;
  },

  /**
   * Add player statistics
   */
  addPlayerStats: async (id: string, statsData: AddPlayerStatInput) => {
    const { data, error } = await apiClient.post(`/matches/${id}/stats`, statsData);
    
    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error('Failed to add player stats');
    }

    return data;
  },

  /**
   * Update match details
   */
  update: async (id: string, data: Partial<Match>) => {
    const { data: match, error } = await apiClient.patch<Match>(`/matches/${id}`, data);
    
    if (error) {
      throw new Error(error);
    }

    if (!match) {
      throw new Error('Match update failed');
    }

    return match;
  },
};

