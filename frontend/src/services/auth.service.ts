/**
 * Cricket 360 - Authentication Service
 * Centralized authentication service for user management
 */

import { User } from '@/types/api.types';
import { RegisterData, LoginCredentials } from '@/types/auth.types';
import * as authApi from '@/lib/api/auth';

export interface AuthService {
  /**
   * Sign up a new user
   */
  signUp: (data: RegisterData & { playerType?: string }) => Promise<User>;
  
  /**
   * Sign in an existing user
   */
  signIn: (credentials: LoginCredentials) => Promise<User>;
  
  /**
   * Sign out the current user
   */
  signOut: () => Promise<boolean>;
  
  /**
   * Get the currently authenticated user
   */
  getCurrentUser: () => Promise<User | null>;
  
  /**
   * Upload profile picture
   */
  uploadProfilePicture: (userId: string, file: File) => Promise<string>;
  
  /**
   * Update user profile
   */
  updateProfile: (userId: string, data: Partial<User>) => Promise<User>;
}

/**
 * Authentication service instance
 * Provides all authentication-related functionality
 */
export const authService: AuthService = {
  signUp: authApi.signUp,
  signIn: authApi.signIn,
  signOut: authApi.signOut,
  getCurrentUser: authApi.getCurrentUser,
  uploadProfilePicture: authApi.uploadProfilePicture,
  updateProfile: authApi.updateProfile,
};

