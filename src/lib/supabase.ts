import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { UserRole } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get the current authenticated user from Supabase Auth
export const getCurrentUser = async (): Promise<SupabaseUser | null> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error fetching user:', error.message);
        return null;
    }
    return user;
};

// Helper to get the user role from the public 'users' table
export const getUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data?.role as UserRole;
    } catch (error) {
        console.error('Error fetching user role:', error);
        return null;
    }
};

// Auth state change listener
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
};

// Generic error handler wrapper
export const handleSupabaseError = <T>(
    data: T | null,
    error: any
): { data: T | null; error: string | null } => {
    if (error) {
        console.error('Supabase request error:', error);
        return { data: null, error: error.message || 'An unexpected error occurred' };
    }
    return { data, error: null };
};
