/**
 * Cricket 360 - Token Management Utilities
 * Handles JWT token storage and retrieval
 */

export const TokenUtils = {
  /**
   * Get access token from localStorage
   */
  getAccessToken: (): string | null => {
    return localStorage.getItem('cricket360_access_token');
  },

  /**
   * Set access token in localStorage
   */
  setAccessToken: (token: string): void => {
    localStorage.setItem('cricket360_access_token', token);
  },

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken: (): string | null => {
    return localStorage.getItem('cricket360_refresh_token');
  },

  /**
   * Set refresh token in localStorage
   */
  setRefreshToken: (token: string): void => {
    localStorage.setItem('cricket360_refresh_token', token);
  },

  /**
   * Clear all authentication data
   */
  clearAuth: (): void => {
    localStorage.removeItem('cricket360_access_token');
    localStorage.removeItem('cricket360_refresh_token');
    localStorage.removeItem('cricket360_user');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('cricket360_access_token');
  },
};

