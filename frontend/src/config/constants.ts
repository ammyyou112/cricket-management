/**
 * Cricket 360 - Application Constants
 */

// API Configuration
export const API_CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Cricket 360',
  URL: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
} as const;

// Feature Flags
export const FEATURES = {
  OFFLINE: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
  NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  REAL_TIME: import.meta.env.VITE_ENABLE_REAL_TIME === 'true',
  FILE_UPLOAD: import.meta.env.VITE_ENABLE_FILE_UPLOAD === 'true',
} as const;

// Debug Configuration
export const DEBUG_CONFIG = {
  ENABLED: import.meta.env.VITE_DEBUG_MODE === 'true',
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
} as const;

// Database Tables
export const TABLES = {
  USERS: 'users',
  TEAMS: 'teams',
  TEAM_MEMBERS: 'team_members',
  TOURNAMENTS: 'tournaments',
  MATCHES: 'matches',
  MATCH_SCORES: 'match_scores',
  PLAYER_STATS: 'player_stats',
  SCORE_UPDATES: 'score_updates',
  NOTIFICATIONS: 'notifications',
} as const;

// Storage Buckets
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  TEAM_LOGOS: 'team-logos',
  MATCH_PHOTOS: 'match-photos',
} as const;

// Validation Rules
export const VALIDATION = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MIN_PASSWORD_LENGTH: 8,
  MAX_TEAM_NAME_LENGTH: 50,
  MAX_TOURNAMENT_NAME_LENGTH: 100,
} as const;

