/**
 * Cricket 360 - Authentication Types
 * TypeScript types for authentication
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role: 'player' | 'captain' | 'admin';
  player_type?: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

