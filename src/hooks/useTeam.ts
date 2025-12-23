import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as teamApi from '../lib/api/teams';
import { TeamFormData } from '../types/forms.types';

export const useMyTeams = (playerId?: string) => {
    return useQuery({
        queryKey: ['myTeams', playerId],
        queryFn: () => {
            if (!playerId) throw new Error('Player ID required');
            return teamApi.getMyTeams(playerId);
        },
        enabled: !!playerId,
    });
};

export const useTeamDetails = (teamId?: string) => {
    return useQuery({
        queryKey: ['team', teamId],
        queryFn: () => {
            if (!teamId) throw new Error('Team ID required');
            return teamApi.getTeamDetails(teamId);
        },
        enabled: !!teamId,
    });
};

export const useAvailableTeams = () => {
    return useQuery({
        queryKey: ['availableTeams'],
        queryFn: teamApi.getAvailableTeams,
    });
};

export const useTeamMembers = (teamId?: string) => {
    return useQuery({
        queryKey: ['teamMembers', teamId],
        queryFn: () => {
            if (!teamId) throw new Error('Team ID required');
            return teamApi.getTeamMembers(teamId);
        },
        enabled: !!teamId,
    });
};

export const useJoinRequests = (teamId?: string) => {
    return useQuery({
        queryKey: ['teamRequests', teamId],
        queryFn: () => {
            if (!teamId) throw new Error('Team ID required');
            return teamApi.getTeamRequests(teamId);
        },
        enabled: !!teamId,
    });
};

export const useCreateTeam = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ data, captainId }: { data: TeamFormData; captainId: string }) =>
            teamApi.createTeam(data, captainId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['availableTeams'] });
            queryClient.invalidateQueries({ queryKey: ['myTeams'] });
        },
    });
};

export const useSendJoinRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ playerId, teamId }: { playerId: string; teamId: string }) =>
            teamApi.sendJoinRequest(playerId, teamId),
        onSuccess: () => {
            // Invalidate queries if necessary, e.g. outgoing requests list
            // For now, maybe just toast success
        },
    });
};

export const useApproveRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ requestId, captainId }: { requestId: string; captainId: string }) =>
            teamApi.approveJoinRequest(requestId, captainId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['teamRequests'] }); // Assuming we can get teamId from context or invalidating globally is okay for now
            queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
        },
    });
};
