/**
 * @deprecated This file is kept for backward compatibility but should not be used.
 * All database operations should go through the backend API.
 * 
 * This file will be removed once all Supabase references are migrated to backend API.
 */

// Placeholder exports to prevent import errors during migration
export const supabase = null as any;

export const getCurrentUser = async () => {
  console.warn('getCurrentUser from supabase.ts is deprecated. Use auth API instead.');
  return null;
};

export const getUserRole = async () => {
  console.warn('getUserRole from supabase.ts is deprecated. Use auth API instead.');
  return null;
};

export const onAuthStateChange = () => {
  console.warn('onAuthStateChange from supabase.ts is deprecated. Use auth API instead.');
  return { data: { subscription: null }, unsubscribe: () => {} };
};

export const handleSupabaseError = <T>(
  data: T | null,
  error: any
): { data: T | null; error: string | null } => {
  console.warn('handleSupabaseError is deprecated. Use handleApiError from apiClient instead.');
  if (error) {
    return { data: null, error: error.message || 'An error occurred' };
  }
  return { data, error: null };
};
