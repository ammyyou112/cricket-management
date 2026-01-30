/**
 * Cricket 360 - Team Service
 * Handles all team-related API calls
 */

import { apiClient } from '@/lib/apiClient';
import { Team, TeamMember, CreateTeamInput, UpdateTeamInput, PaginatedResponse } from '@/types/api.types';

export interface GetTeamsParams {
  search?: string;
  captainId?: string;
  page?: number;
  limit?: number;
}

export const teamService = {
  /**
   * Get all teams with pagination and filters
   */
  getAll: async (params?: GetTeamsParams) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.captainId) queryParams.append('captainId', params.captainId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/teams${queryString ? `?${queryString}` : ''}`;

    const { data, error } = await apiClient.get<PaginatedResponse<Team>>(endpoint);
    
    if (error) {
      throw new Error(error);
    }

    return data;
  },

  /**
   * Get team by ID
   */
  getById: async (id: string) => {
    const { data, error } = await apiClient.get<Team>(`/teams/${id}`);
    
    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error('Team not found');
    }

    return data;
  },

  /**
   * Get team members
   */
  getTeamMembers: async (teamId: string) => {
    const { data, error } = await apiClient.get<TeamMember[]>(`/teams/${teamId}/members`);
    
    if (error) {
      throw new Error(error);
    }

    return data || [];
  },

  /**
   * Create a new team
   */
  create: async (data: CreateTeamInput) => {
    const { data: team, error } = await apiClient.post<Team>('/teams', data);
    
    if (error) {
      throw new Error(error);
    }

    if (!team) {
      throw new Error('Team creation failed');
    }

    return team;
  },

  /**
   * Update team
   */
  update: async (id: string, data: UpdateTeamInput) => {
    const { data: team, error } = await apiClient.patch<Team>(`/teams/${id}`, data);
    
    if (error) {
      throw new Error(error);
    }

    if (!team) {
      throw new Error('Team update failed');
    }

    return team;
  },

  /**
   * Delete team
   */
  delete: async (id: string) => {
    const { error } = await apiClient.delete(`/teams/${id}`);
    
    if (error) {
      throw new Error(error);
    }

    return true;
  },

  /**
   * Add member to team
   */
  addMember: async (teamId: string, userId: string) => {
    const { data, error } = await apiClient.post<TeamMember>(`/teams/${teamId}/members`, {
      userId,
    });
    
    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error('Failed to add member');
    }

    return data;
  },

  /**
   * Invite member to team
   * @param teamId - Team ID
   * @param userId - User ID of the player to invite
   */
  inviteMember: async (teamId: string, userId: string) => {
    const { data, error } = await apiClient.post<TeamMember>(`/teams/${teamId}/invite`, {
      userId,
    });
    
    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error('Failed to invite member');
    }

    return data;
  },

  /**
   * Remove member from team (captain/admin only)
   */
  removeMember: async (teamId: string, userId: string) => {
    const { error } = await apiClient.delete(`/teams/${teamId}/members/${userId}`);
    
    if (error) {
      throw new Error(error);
    }

    return true;
  },

  /**
   * Leave team (player-initiated)
   */
  leaveTeam: async (teamId: string) => {
    const { error } = await apiClient.post(`/teams/${teamId}/leave`);
    
    if (error) {
      throw new Error(error);
    }

    return true;
  },

  /**
   * Upload team logo
   */
  uploadLogo: async (teamId: string, file: File) => {
    const { data: response, error } = await apiClient.uploadFile<{ url: string }>(
      `/upload/team/${teamId}`,
      file
    );

    if (error) {
      throw new Error(error);
    }

    if (!response || !response.url) {
      throw new Error('Upload failed');
    }

    return response.url;
  },

  /**
   * Get user's teams
   */
  getMyTeams: async () => {
    const { data, error } = await apiClient.get<Team[]>('/teams/my-teams');
    
    if (error) {
      throw new Error(error);
    }

    return data || [];
  },

  /**
   * Request to join a team (player-initiated)
   */
  requestToJoin: async (teamId: string) => {
    const { data, error } = await apiClient.post<TeamMember>(`/teams/${teamId}/request`);
    
    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error('Join request failed');
    }

    return data;
  },

  /**
   * Get pending join requests for a team (captain/admin only)
   */
  getPendingRequests: async (teamId: string) => {
    const { data, error } = await apiClient.get<TeamMember[]>(`/teams/${teamId}/requests`);
    
    if (error) {
      throw new Error(error);
    }

    return data || [];
  },

  /**
   * Update member status (approve/reject join request or accept/reject invitation)
   */
  updateMemberStatus: async (teamId: string, playerId: string, status: 'ACTIVE' | 'REJECTED') => {
    const { data, error } = await apiClient.patch<TeamMember>(`/teams/${teamId}/members/${playerId}`, {
      status,
    });
    
    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error('Failed to update member status');
    }

    return data;
  },

  /**
   * Get player invitations (INVITED status for logged-in player)
   */
  getMyInvitations: async () => {
    const { data, error } = await apiClient.get<TeamMember[]>(`/teams/invitations/my`);
    
    if (error) {
      throw new Error(error);
    }

    return data || [];
  },

  /**
   * Get player's pending join requests (PENDING status for logged-in player)
   */
  getMyPendingRequests: async () => {
    const { data, error } = await apiClient.get<TeamMember[]>(`/teams/requests/my`);
    
    if (error) {
      throw new Error(error);
    }

    return data || [];
  },
};

