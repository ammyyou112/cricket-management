import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types/database.types';

interface AuthState {
    user: User | null;
    role: UserRole | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null, role: UserRole | null) => void;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
    setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            role: null,
            isAuthenticated: false,
            isLoading: true, // Default to true until checked
            setUser: (user, role) =>
                set({
                    user,
                    role,
                    isAuthenticated: !!user,
                    isLoading: false,
                }),
            logout: () =>
                set({
                    user: null,
                    role: null,
                    isAuthenticated: false,
                    isLoading: false,
                }),
            updateUser: (data) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...data } : null,
                })),
            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: 'auth-storage', // name of the item in the storage (must be unique)
            partialize: (state) => ({ user: state.user, role: state.role, isAuthenticated: state.isAuthenticated }), // persist only these fields
        }
    )
);
