import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../lib/api/auth';
import { LoginCredentials, RegisterData } from '../types/auth.types';
import { UserRole, PlayerType, User } from '../types/database.types';
import { User as ApiUser } from '../types/api.types';
import { TokenUtils } from '../utils/token.utils';

// Only log in development mode
const isDev = import.meta.env.DEV;
const log = (...args: any[]) => {
  if (isDev) {
    console.log(...args);
  }
};
const logError = (...args: any[]) => {
  if (isDev) {
    console.error(...args);
  }
};

/**
 * Transform backend user format to frontend format
 */
const transformUser = (apiUser: ApiUser): User => {
    // Backend returns uppercase roles, frontend uses lowercase
    const roleMap: Record<string, UserRole> = {
        'PLAYER': 'player',
        'CAPTAIN': 'captain',
        'ADMIN': 'admin',
    };

    const playerTypeMap: Record<string, PlayerType> = {
        'BATSMAN': 'batsman',
        'BOWLER': 'bowler',
        'ALL_ROUNDER': 'all-rounder',
        'WICKET_KEEPER': 'wicket-keeper',
    };

    return {
        id: apiUser.id,
        email: apiUser.email,
        full_name: apiUser.fullName,
        role: roleMap[apiUser.role] || 'player',
        profile_picture: apiUser.profilePictureUrl,
        phone: apiUser.phone,
        player_type: apiUser.playerType ? playerTypeMap[apiUser.playerType] : undefined,
        created_at: apiUser.createdAt,
    };
};

export const useAuth = () => {
    const {
        user,
        role,
        isAuthenticated,
        isLoading: storeLoading,
        setUser,
        logout: storeLogout,
        updateUser,
        setLoading: setStoreLoading
    } = useAuthStore();

    const [error, setError] = useState<string | null>(null);
    const initRef = useRef(false); // Prevent multiple initializations

    // Initialize: Check for valid token and fetch user from backend
    useEffect(() => {
        // Skip if already initialized or if user is already loaded
        if (initRef.current || (!storeLoading && user)) {
            return;
        }

        const initAuth = async () => {
            // Mark as initialized immediately to prevent duplicate calls
            initRef.current = true;

            try {
                // Check if we have a valid token
                const token = TokenUtils.getAccessToken();
                
                if (token) {
                    // Try to fetch current user from backend
                    const currentUser = await authApi.getCurrentUser();
                    
                    if (currentUser) {
                        // Transform and set user
                        const transformedUser = transformUser(currentUser);
                        setUser(transformedUser, transformedUser.role);
                        log('✅ Auto-login successful');
                    } else {
                        // Token exists but invalid, clear everything
                        log('⚠️ Token invalid, clearing auth');
                        TokenUtils.clearAuth();
                        storeLogout();
                    }
                } else {
                    // No token, clear any persisted state
                    if (!user) {
                        storeLogout();
                    }
                }
            } catch (err: any) {
                // Error fetching user (token expired, invalid, etc.)
                logError('⚠️ Auth check failed:', err.message);
                TokenUtils.clearAuth();
                if (!user) {
                    storeLogout();
                }
            } finally {
                setStoreLoading(false);
            }
        };

        initAuth();
    }, []); // Only run on mount

    const login = async ({ email, password }: LoginCredentials) => {
        setStoreLoading(true);
        setError(null);
        try {
            const apiUser = await authApi.signIn({ email, password });
            const user = transformUser(apiUser);
            setUser(user, user.role);
            log('✅ Login successful');
            return user;
        } catch (err: any) {
            const errorMessage = err.message || 'Login failed. Please check your credentials.';
            setError(errorMessage);
            logError('❌ Login failed:', errorMessage);
            throw err; // Re-throw so components can handle it too
        } finally {
            setStoreLoading(false);
        }
    };

    const register = async (
        email: string,
        password: string,
        full_name: string,
        role: UserRole,
        playerType?: PlayerType
    ) => {
        setStoreLoading(true);
        setError(null);
        try {
            const data: RegisterData & { playerType?: string } = {
                email,
                password,
                full_name,
                role,
                playerType: playerType ? playerType.toUpperCase().replace('-', '_') : undefined,
            };

            const apiUser = await authApi.signUp(data);
            if (apiUser) {
                const user = transformUser(apiUser);
                setUser(user, user.role);
                log('✅ Registration successful');
                return user;
            }
            throw new Error('Registration failed');
        } catch (err: any) {
            const errorMessage = err.message || 'Registration failed. Please try again.';
            setError(errorMessage);
            logError('❌ Registration failed:', errorMessage);
            throw err;
        } finally {
            setStoreLoading(false);
        }
    };

    const logout = async () => {
        setStoreLoading(true);
        try {
            await authApi.signOut();
            storeLogout();
        } catch (err: any) {
            setError(err.message || 'Logout failed');
            logError('Logout error:', err.message || 'Logout failed');
        } finally {
            setStoreLoading(false);
        }
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user) return;
        setStoreLoading(true);
        setError(null);
        try {
            const updatedUser = await authApi.updateProfile(user.id, data);
            updateUser(updatedUser);
            return updatedUser;
        } catch (err: any) {
            const errorMessage = err.message || 'Update failed';
            setError(errorMessage);
            throw err;
        } finally {
            setStoreLoading(false);
        }
    };

    return {
        user,
        role,
        isAuthenticated,
        isLoading: storeLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
    };
};
