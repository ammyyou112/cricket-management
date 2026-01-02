/**
 * Cricket 360 - Tournament Service
 * Handles all tournament-related API calls
 */

import { apiClient } from '@/lib/apiClient';
import { Tournament, CreateTournamentInput, UpdateTournamentInput, PaginatedResponse } from '@/types/api.types';

export interface GetTournamentsParams {
  status?: string;
  page?: number;
  limit?: number;
}

export const tournamentService = {
  /**
   * Get all tournaments with pagination and filters
   */
  getAll: async (params?: GetTournamentsParams) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/tournaments${queryString ? `?${queryString}` : ''}`;

    const { data, error } = await apiClient.get<PaginatedResponse<Tournament>>(endpoint);
    
    if (error) {
      throw new Error(error);
    }

    return data;
  },

  /**
   * Get tournament by ID
   */
  getById: async (id: string) => {
    const { data, error } = await apiClient.get<Tournament>(`/tournaments/${id}`);
    
    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error('Tournament not found');
    }

    return data;
  },

  /**
   * Create a new tournament
   */
  create: async (data: CreateTournamentInput) => {
    const { data: tournament, error } = await apiClient.post<Tournament>('/tournaments', data);
    
    if (error) {
      throw new Error(error);
    }

    if (!tournament) {
      throw new Error('Tournament creation failed');
    }

    return tournament;
  },

  /**
   * Update tournament
   */
  update: async (id: string, data: UpdateTournamentInput) => {
    const { data: tournament, error } = await apiClient.patch<Tournament>(`/tournaments/${id}`, data);
    
    if (error) {
      throw new Error(error);
    }

    if (!tournament) {
      throw new Error('Tournament update failed');
    }

    return tournament;
  },

  /**
   * Delete tournament
   */
  delete: async (id: string) => {
    const { error } = await apiClient.delete(`/tournaments/${id}`);
    
    if (error) {
      throw new Error(error);
    }

    return true;
  },
};

