import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as tournamentApi from '../lib/api/tournaments';
import { TournamentFormData } from '../types/forms.types';

export const useTournaments = (status?: 'upcoming' | 'ongoing' | 'completed') => {
  return useQuery({
    queryKey: ['tournaments', status],
    queryFn: async () => {
      const result = await tournamentApi.getTournaments(status);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });
};

export const useTournamentDetails = (tournamentId?: string) => {
  return useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: async () => {
      if (!tournamentId) throw new Error('Tournament ID required');
      const result = await tournamentApi.getTournamentDetails(tournamentId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!tournamentId,
  });
};

export const useTournamentMatches = (tournamentId?: string) => {
  return useQuery({
    queryKey: ['tournamentMatches', tournamentId],
    queryFn: async () => {
      if (!tournamentId) throw new Error('Tournament ID required');
      const result = await tournamentApi.getTournamentMatches(tournamentId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: !!tournamentId,
  });
};

export const useTournamentStandings = (tournamentId?: string) => {
  return useQuery({
    queryKey: ['tournamentStandings', tournamentId],
    queryFn: async () => {
      if (!tournamentId) throw new Error('Tournament ID required');
      const result = await tournamentApi.getTournamentStandings(tournamentId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!tournamentId,
  });
};

export const useCreateTournament = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, adminId }: { data: TournamentFormData; adminId: string }) => {
      const result = await tournamentApi.createTournament(data, adminId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
};

export const useDeleteTournament = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tournamentId: string) => {
      const result = await tournamentApi.deleteTournament(tournamentId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
};

