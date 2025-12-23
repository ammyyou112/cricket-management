import { supabase } from '../supabase';
import { User, UserRole, PlayerType } from '../../types/database.types';
import { RegisterData, LoginCredentials } from '../../types/auth.types';

/**
 * Sign up a new user and create their profile in the database.
 * @param data Registration data including email, password, name, role, etc.
 * @returns The created user profile with role or throws an error.
 */
export const signUp = async (data: RegisterData & { player_type?: PlayerType }) => {
    const { email, password, full_name, role, phone, player_type } = data;

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name,
                role,
            },
        },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // 2. Insert user profile into public table
    // Note: If you have a Trigger setup in Supabase to auto-create profiles, this step might fail or be redundant.
    // We'll attempt to insert/upsert here as requested.
    const userProfile: User = {
        id: authData.user.id,
        email,
        full_name,
        role,
        phone,
        player_type: role === 'player' ? player_type : undefined,
        created_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
        .from('users')
        .insert(userProfile);

    if (profileError) {
        // If insert fails, clean up auth user to prevent inconsistent state
        // await supabase.auth.admin.deleteUser(authData.user.id); // Requires admin service role, can't do client side usually.
        throw profileError;
    }

    return userProfile;
};

/**
 * Sign in an existing user and fetch their complete profile.
 * @param credentials Email and password
 * @returns User profile data including role.
 */
export const signIn = async ({ email, password }: LoginCredentials) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Authentication failed');

    // Fetch full profile
    const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    if (profileError) throw profileError;

    return userProfile as User;
};

/**
 * Sign out the current user.
 */
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
};

/**
 * Get the currently authenticated user with their full profile.
 * @returns User profile or null if not authenticated.
 */
export const getCurrentUser = async (): Promise<User | null> => {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) return null;

    const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return null;
    }

    return userProfile as User;
};

/**
 * Upload a profile picture to Supabase storage.
 * @param userId User ID
 * @param file File object to upload
 * @returns Public URL of the uploaded image
 */
export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
            upsert: true,
        });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
};

/**
 * Update user profile data.
 * @param userId User ID
 * @param data Partial user data to update
 * @returns Updated user profile
 */
export const updateProfile = async (userId: string, data: Partial<User>) => {
    const { data: updatedUser, error } = await supabase
        .from('users')
        .update(data)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return updatedUser as User;
};
