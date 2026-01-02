/**
 * Cricket 360 - User Types
 * TypeScript types for user operations
 */

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  player_type?: string;
  phone?: string;
  profile_picture?: string;
  created_at: Date;
}

export interface UpdateUserData {
  full_name?: string;
  phone?: string;
  player_type?: string;
  profile_picture?: string;
}

