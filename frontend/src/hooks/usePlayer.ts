import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as playerApi from '../lib/api/players';
import * as authApi from '../lib/api/auth';
import { User } from '../types/database.types';

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

    return useMutation({
        mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
            const result = await authApi.updateProfile(userId, data);
            return result;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['player', variables.userId] });
            queryClient.setQueryData(['player', variables.userId], data); // Optimistic update
        },
    });
};
