import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as matchApi from '../lib/api/matches';
import { MatchFormData, ScoringFormData } from '../types/forms.types';

export const useUpcomingMatches = () => {
    return useQuery({
        queryKey: ['matches', 'upcoming'],
        queryFn: matchApi.getUpcomingMatches,
    });
};

export const useLiveMatches = () => {
    return useQuery({
        queryKey: ['matches', 'live'],
        queryFn: matchApi.getLiveMatches,
        refetchInterval: 30000, // Poll every 30 seconds for live updates
    });
};

export const useMatchDetails = (matchId?: string) => {
    return useQuery({
        queryKey: ['match', matchId],
        queryFn: () => {
            if (!matchId) throw new Error('Match ID required');
            return matchApi.getMatch(matchId);
        },
        enabled: !!matchId,
    });
};

export const useMatchScore = (matchId?: string) => {
    return useQuery({
        queryKey: ['matchScore', matchId],
        queryFn: () => {
            if (!matchId) throw new Error('Match ID required');
            return matchApi.getMatchScore(matchId);
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
        mutationFn: ({ matchId, captainId }: { matchId: string; captainId: string }) =>
            matchApi.requestScoring(matchId, captainId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['match', variables.matchId] });
        },
    });
};

export const useApproveScoring = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ matchId, captainId }: { matchId: string; captainId: string }) =>
            matchApi.approveScoring(matchId, captainId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['match', variables.matchId] });
        },
    });
};

export const useUpdateScore = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ matchId, data }: { matchId: string; data: ScoringFormData }) =>
            matchApi.updateLiveScore(matchId, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['matchScore', variables.matchId] });
        },
    });
};
