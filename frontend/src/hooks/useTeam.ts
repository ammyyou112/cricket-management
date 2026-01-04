import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as teamApi from '../lib/api/teams';
import * as statsApi from '../lib/api/stats';
import { TeamFormData } from '../types/forms.types';

export const useMyTeams = (playerId?: string) => {
    return useQuery({
        queryKey: ['myTeams', playerId],
        queryFn: async () => {
            // ✅ FIXED: Use teamService.getMyTeams() which uses correct endpoint /teams/my-teams
            const { teamService } = await import('../services/team.service');
            const teams = await teamService.getMyTeams();
            return Array.isArray(teams) ? teams : (teams.data || []);
        },
        enabled: true, // No longer requires playerId since endpoint uses auth token
    });
};

export const useTeamDetails = (teamId?: string) => {
    return useQuery({
        queryKey: ['team', teamId],
        queryFn: async () => {
            if (!teamId) throw new Error('Team ID required');
            const result = await teamApi.getTeamDetails(teamId);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!teamId,
    });
};

export const useAvailableTeams = () => {
    return useQuery({
        queryKey: ['availableTeams'],
        queryFn: async () => {
            const result = await teamApi.getAvailableTeams();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data || [];
        },
    });
};

export const useTeamMembers = (teamId?: string) => {
    return useQuery({
        queryKey: ['teamMembers', teamId],
        queryFn: async () => {
            if (!teamId) {
                console.log('⚠️ useTeamMembers: No teamId provided');
                throw new Error('Team ID required');
            }
            console.log('🔍 useTeamMembers: Fetching members for team:', teamId);
            const result = await teamApi.getTeamMembers(teamId);
            if (result.error) {
                console.error('❌ useTeamMembers: API error:', result.error);
                throw new Error(result.error);
            }
            console.log('✅ useTeamMembers: Received members:', result.data?.length || 0, result.data);
            return result.data || [];
        },
        enabled: !!teamId,
    });
};

export const useJoinRequests = (teamId?: string) => {
    return useQuery({
        queryKey: ['teamRequests', teamId],
        queryFn: async () => {
            if (!teamId) {
                console.log('⚠️ useJoinRequests: No teamId provided');
                throw new Error('Team ID required');
            }
            console.log('🔍 useJoinRequests: Fetching requests for team:', teamId);
            // Use the new teamService
            const { teamService } = await import('../services/team.service');
            const requests = await teamService.getPendingRequests(teamId);
            console.log('✅ useJoinRequests: Received requests:', requests?.length || 0, requests);
            return requests || [];
        },
        enabled: !!teamId,
    });
};

export const useCreateTeam = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ data, captainId }: { data: TeamFormData; captainId: string }) => {
            const result = await teamApi.createTeam(data, captainId);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['availableTeams'] });
            queryClient.invalidateQueries({ queryKey: ['myTeams'] });
        },
    });
};

export const useSendJoinRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ playerId, teamId }: { playerId: string; teamId: string }) => {
            const result = await teamApi.sendJoinRequest(playerId, teamId);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            // Invalidate queries if necessary, e.g. outgoing requests list
            // For now, maybe just toast success
        },
    });
};

export const useApproveRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ requestId, captainId }: { requestId: string; captainId: string }) => {
            const result = await teamApi.approveJoinRequest(requestId, captainId);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['teamRequests'] }); // Assuming we can get teamId from context or invalidating globally is okay for now
            queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
        },
    });
};

export const useTeamStats = (teamId?: string) => {
    return useQuery({
        queryKey: ['teamStats', teamId],
        queryFn: async () => {
            if (!teamId) throw new Error('Team ID required');
            const result = await statsApi.getTeamStats(teamId);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!teamId,
    });
};
