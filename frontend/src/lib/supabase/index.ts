/**
 * Cricket 360 - Supabase Services
 * Central export file for all Supabase services
 */

// Core client
export { supabase, isSupabaseConfigured, getSupabaseClient } from './client';

// Services (will be implemented in next prompts)
export * from './auth';
export * from './teams';
export * from './matches';
export * from './tournaments';
export * from './stats';
export * from './storage';
export * from './realtime';

// Types
export type { Database } from './types';

