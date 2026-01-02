/**
 * Cricket 360 - Supabase Helper Functions
 * Utility functions for common Supabase operations
 */

import { PostgrestError } from '@supabase/supabase-js';

/**
 * Extract error message from Supabase error
 */
export const getErrorMessage = (error: PostgrestError | Error | null): string => {
  if (!error) return 'An unknown error occurred';
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if ('message' in error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
};

/**
 * Check if error is a PostgrestError
 */
export const isPostgrestError = (error: unknown): error is PostgrestError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error &&
    'hint' in error
  );
};

/**
 * Handle Supabase response with error checking
 */
export const handleSupabaseResponse = <T>(
  data: T | null,
  error: PostgrestError | null
): { data: T | null; error: string | null } => {
  if (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
  
  return {
    data,
    error: null,
  };
};

