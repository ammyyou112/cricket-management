import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as playerApi from '../lib/api/players';
import * as authApi from '../lib/api/auth';
import { User } from '../types/database.types';
import { useAuthStore } from '../store/authStore';

export const usePlayerProfile = (userId?: string) => {
    return useQuery({
        queryKey: ['player', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User ID is required');
            const result = await playerApi.getPlayerProfile(userId);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!userId,
    });
};

export const usePlayerStats = (userId?: string) => {
    return useQuery({
        queryKey: ['playerStats', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User ID is required');
            const result = await playerApi.getPlayerStats(userId);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data || [];
        },
        enabled: !!userId,
    });
};

export const useMatchHistory = (userId?: string) => {
    return useQuery({
        queryKey: ['playerMatches', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User ID is required');
            const result = await playerApi.getPlayerMatchHistory(userId);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data || [];
        },
        enabled: !!userId,
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    const { updateUser } = useAuthStore();

    return useMutation({
        mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
            const result = await authApi.updateProfile(userId, data);
            return result;
        },
        onSuccess: (updatedUser, variables) => {
            // Invalidate and update React Query cache
            queryClient.invalidateQueries({ queryKey: ['player', variables.userId] });
            queryClient.setQueryData(['player', variables.userId], updatedUser);
            
            // Transform backend format to frontend format
            const transformUser = (apiUser: any) => {
                const roleMap: Record<string, string> = {
                    'PLAYER': 'player',
                    'CAPTAIN': 'captain',
                    'ADMIN': 'admin',
                };
                const playerTypeMap: Record<string, string> = {
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
            
            // Update auth store with transformed user
            const transformedUser = transformUser(updatedUser);
            updateUser(transformedUser);
            
            // Update localStorage user data
            const currentUserStr = localStorage.getItem('cricket360_user');
            if (currentUserStr) {
                try {
                    const currentUser = JSON.parse(currentUserStr);
                    const updatedUserData = { ...currentUser, ...transformedUser };
                    localStorage.setItem('cricket360_user', JSON.stringify(updatedUserData));
                } catch (e) {
                    console.error('Failed to update localStorage user:', e);
                }
            }
        },
    });
};
