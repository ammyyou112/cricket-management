/**
 * Cricket 360 - User Service
 * Handles all user-related API calls
 */

import { apiClient } from '@/lib/apiClient';
import { User, PaginatedResponse } from '@/types/api.types';

export interface GetUsersParams {
  search?: string;
  role?: string;
  playerType?: string;
  page?: number;
  limit?: number;
}

export const userService = {
  /**
   * Get all users (admin only) with pagination and filters
   */
  getAll: async (params?: GetUsersParams): Promise<PaginatedResponse<User> | User[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.playerType) queryParams.append('playerType', params.playerType);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;

    const { data, error } = await apiClient.get<any>(endpoint);
    
    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error('Failed to fetch users');
    }

    // Backend returns { success, message, data: [...], pagination: {...} }
    // apiClient extracts the data field, which contains the array
    // But we need to check if it's a full PaginatedResponse or just the array
    return data;
  },

  /**
   * Get user by ID
   */
  getById: async (id: string): Promise<User> => {
    const { data, error } = await apiClient.get<User>(`/users/${id}`);
    
    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error('User not found');
    }

    return data;
  },

  /**
   * Delete user (admin only)
   */
  delete: async (id: string): Promise<void> => {
    const { error } = await apiClient.delete(`/users/${id}`);
    
    if (error) {
      throw new Error(error);
    }
  },

  /**
   * Block user (admin only)
   */
  block: async (id: string): Promise<User> => {
    const { data, error } = await apiClient.patch<User>(`/users/${id}/block`, {});
    
    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error('Failed to block user');
    }

    return data;
  },

  /**
   * Unblock user (admin only)
   */
  unblock: async (id: string): Promise<User> => {
    const { data, error } = await apiClient.patch<User>(`/users/${id}/unblock`, {});
    
    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error('Failed to unblock user');
    }

    return data;
  },

  /**
   * Suspend user (admin only)
   */
  suspend: async (id: string, reason?: string): Promise<User> => {
    const { data, error } = await apiClient.patch<User>(`/users/${id}/suspend`, { reason });
    
    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error('Failed to suspend user');
    }

    return data;
  },

  /**
   * Unsuspend user (admin only)
   */
  unsuspend: async (id: string): Promise<User> => {
    const { data, error } = await apiClient.patch<User>(`/users/${id}/unsuspend`, {});
    
    if (error) {
      throw new Error(error);
    }

    if (!data) {
      throw new Error('Failed to unsuspend user');
    }

    return data;
  },
};

