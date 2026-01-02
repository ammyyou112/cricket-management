import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as matchApi from '../lib/api/matches';
import { MatchFormData, ScoringFormData } from '../types/forms.types';
import { saveOfflineScore } from '../lib/offlineStorage';
import { useOfflineDetection } from './useOfflineDetection';

export const useUpcomingMatches = () => {
    return useQuery({
        queryKey: ['matches', 'upcoming'],
        queryFn: async () => {
            const result = await matchApi.getUpcomingMatches();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data || [];
        },
    });
};

export const useLiveMatches = () => {
    return useQuery({
        queryKey: ['matches', 'live'],
        queryFn: async () => {
            const result = await matchApi.getLiveMatches();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data || [];
        },
        refetchInterval: 30000, // Poll every 30 seconds for live updates
    });
};

export const useMatchDetails = (matchId?: string) => {
    return useQuery({
        queryKey: ['match', matchId],
        queryFn: async () => {
            if (!matchId) throw new Error('Match ID required');
            const result = await matchApi.getMatch(matchId);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!matchId,
    });
};

export const useMatchScore = (matchId?: string) => {
    return useQuery({
        queryKey: ['matchScore', matchId],
        queryFn: async () => {
            if (!matchId) throw new Error('Match ID required');
            const result = await matchApi.getMatchScore(matchId);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data || [];
        },
        enabled: !!matchId,
        refetchInterval: 10000, // Poll every 10 seconds for live score
    });
};

export const useCreateMatch = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ data, adminId }: { data: MatchFormData; adminId: string }) =>
            matchApi.createMatch(data, adminId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['matches', 'upcoming'] });
        },
    });
};

export const useRequestScoring = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ matchId, captainId }: { matchId: string; captainId: string }) => {
            const result = await matchApi.requestScoring(matchId, captainId);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['match', variables.matchId] });
        },
    });
};

export const useApproveScoring = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ matchId, captainId }: { matchId: string; captainId: string }) => {
            const result = await matchApi.approveScoring(matchId, captainId);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['match', variables.matchId] });
        },
    });
};

export const useUpdateScore = () => {
    const queryClient = useQueryClient();
    const { isOnline } = useOfflineDetection();

    return useMutation({
        mutationFn: async ({ matchId, data }: { matchId: string; data: ScoringFormData }) => {
            // If offline, save to IndexedDB instead
            if (!isOnline) {
                await saveOfflineScore(matchId, data);
                // Return a mock success response
                return { match_id: matchId, ...data };
            }
            // Online: use normal API
            const result = await matchApi.updateLiveScore(matchId, data);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
            // Only invalidate if online (offline saves will sync later)
            if (isOnline) {
                queryClient.invalidateQueries({ queryKey: ['matchScore', variables.matchId] });
            }
        },
    });
};
