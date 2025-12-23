import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../lib/api/auth';
import { LoginCredentials, RegisterData } from '../types/auth.types';
import { UserRole, PlayerType, User } from '../types/database.types';

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

    const login = async ({ email, password }: LoginCredentials) => {
        setStoreLoading(true);
        setError(null);
        try {
            const user = await authApi.signIn({ email, password });
            setUser(user, user.role);
            return user;
        } catch (err: any) {
            const errorMessage = err.message || 'Login failed';
            setError(errorMessage);
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
            const data: RegisterData & { player_type?: PlayerType } = {
                email,
                password,
                full_name,
                role,
                player_type: playerType
            };

            const user = await authApi.signUp(data);
            if (user) {
                setUser(user, user.role);
            }
            return user;
        } catch (err: any) {
            const errorMessage = err.message || 'Registration failed';
            setError(errorMessage);
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
            console.error(err);
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
        updateProfile
    };
};
