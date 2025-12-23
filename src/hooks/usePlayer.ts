import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as playerApi from '../lib/api/players';
import * as authApi from '../lib/api/auth';
import { User } from '../types/database.types';

export const usePlayerProfile = (userId?: string) => {
    return useQuery({
        queryKey: ['player', userId],
        queryFn: () => {
            if (!userId) throw new Error('User ID is required');
            return playerApi.getPlayerProfile(userId);
        },
        enabled: !!userId,
    });
};

export const usePlayerStats = (userId?: string) => {
    return useQuery({
        queryKey: ['playerStats', userId],
        queryFn: () => {
            if (!userId) throw new Error('User ID is required');
            return playerApi.getPlayerStats(userId);
        },
        enabled: !!userId,
    });
};

export const useMatchHistory = (userId?: string) => {
    return useQuery({
        queryKey: ['playerMatches', userId],
        queryFn: () => {
            if (!userId) throw new Error('User ID is required');
            return playerApi.getPlayerMatchHistory(userId);
        },
        enabled: !!userId,
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: Partial<User> }) =>
            authApi.updateProfile(userId, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['player', variables.userId] });
            queryClient.setQueryData(['player', variables.userId], data); // Optimistic update
        },
    });
};
