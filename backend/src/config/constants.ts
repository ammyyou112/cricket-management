/**
 * Cricket 360 - Application Constants
 */

export const APP_CONFIG = {
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
};

export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || '',
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
} as const;

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
};

export const SUPABASE_CONFIG = {
  URL: process.env.SUPABASE_URL!,
  SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'cricket360-uploads',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

