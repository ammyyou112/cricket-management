import { apiClient, handleApiError } from '../apiClient';
import { Tournament, Match, TournamentStatus } from '../../types/database.types';
import { TournamentFormData } from '../../types/forms.types';
import { mockTournaments, mockMatches, delay } from '../mockData';

// MOCK MODE: Set to true for frontend testing without backend
const MOCK_MODE = true;

// 1. Create tournament
export const createTournament = async (tournamentData: TournamentFormData, adminId: string) => {
  if (MOCK_MODE) {
    await delay(500);
    const newTournament: Tournament = {
      id: Date.now().toString(),
      ...tournamentData,
      created_by: adminId,
      created_at: new Date().toISOString(),
    };
    return handleApiError<Tournament>(newTournament, null);
  }

  const { data, error } = await apiClient.post<Tournament>('/tournaments', {
    ...tournamentData,
    created_by: adminId,
  });
  
  return handleApiError<Tournament>(data, error);
};

// 2. Get all/filtered tournaments
export const getTournaments = async (status?: TournamentStatus) => {
  if (MOCK_MODE) {
    await delay(300);
    let tournaments = [...mockTournaments];
    if (status) {
      tournaments = tournaments.filter(t => t.status === status);
    }
    return handleApiError<Tournament[]>(tournaments, null);
  }

  const endpoint = status ? `/tournaments?status=${status}` : '/tournaments';
  const { data, error } = await apiClient.get<Tournament[]>(endpoint);
  
  return handleApiError<Tournament[]>(data, error);
};

// 3. Get specific tournament
export const getTournamentDetails = async (tournamentId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const tournament = mockTournaments.find(t => t.id === tournamentId) || mockTournaments[0];
    return handleApiError<Tournament>(tournament, null);
  }

  const { data, error } = await apiClient.get<Tournament>(`/tournaments/${tournamentId}`);
  
  return handleApiError<Tournament>(data, error);
};

// 4. Update tournament
export const updateTournament = async (tournamentId: string, data: Partial<Tournament>) => {
  if (MOCK_MODE) {
    await delay(500);
    const tournament = mockTournaments.find(t => t.id === tournamentId) || mockTournaments[0];
    const updated = { ...tournament, ...data };
    return handleApiError<Tournament>(updated, null);
  }

  const { data: updatedTournament, error } = await apiClient.patch<Tournament>(
    `/tournaments/${tournamentId}`,
    data
  );
  
  return handleApiError<Tournament>(updatedTournament, error);
};

// 5. Delete tournament
export const deleteTournament = async (tournamentId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    return handleApiError(null, null);
  }

  const { error } = await apiClient.delete(`/tournaments/${tournamentId}`);
  
  return handleApiError(null, error);
};

// 6. Get all matches for a tournament
export const getTournamentMatches = async (tournamentId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const matches = mockMatches.filter(m => m.tournament_id === tournamentId);
    return handleApiError<Match[]>(matches, null);
  }

  const { data, error } = await apiClient.get<Match[]>(`/tournaments/${tournamentId}/matches`);
  
  return handleApiError<Match[]>(data, error);
};

// 7. Get team standings
export const getTournamentStandings = async (tournamentId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    return handleApiError({ teams: [] }, null);
  }

  const { data, error } = await apiClient.get(`/tournaments/${tournamentId}/standings`);
  
  return handleApiError(data, error);
};
