import { apiClient, handleApiError } from '../apiClient';
import { Match, MatchScore, MatchStatus } from '../../types/database.types';
import { MatchFormData, ScoringFormData } from '../../types/forms.types';
import { mockMatches, mockMatchScores, mockTeams, delay } from '../mockData';

// MOCK MODE: Set to true for frontend testing without backend
const MOCK_MODE = true;

// 1. Schedule match
export const createMatch = async (matchData: MatchFormData, adminId: string) => {
  if (MOCK_MODE) {
    await delay(500);
    const newMatch: Match = {
      id: Date.now().toString(),
      ...matchData,
      created_at: new Date().toISOString(),
    };
    return handleApiError<Match>(newMatch, null);
  }

  const { data, error } = await apiClient.post<Match>('/matches', {
    ...matchData,
    created_by: adminId,
  });
  
  return handleApiError<Match>(data, error);
};

// 2. Get match details
export const getMatch = async (matchId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const match = mockMatches.find(m => m.id === matchId) || mockMatches[0];
    // Add team details
    const matchWithTeams = {
      ...match,
      team_a: mockTeams.find(t => t.id === match.team_a_id),
      team_b: mockTeams.find(t => t.id === match.team_b_id),
    };
    return handleApiError<Match>(matchWithTeams as any, null);
  }

  const { data, error } = await apiClient.get<Match>(`/matches/${matchId}`);
  
  return handleApiError<Match>(data, error);
};

// 3. Get matches by tournament
export const getMatchesByTournament = async (tournamentId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const matches = mockMatches.filter(m => m.tournament_id === tournamentId);
    return handleApiError<Match[]>(matches, null);
  }

  const { data, error } = await apiClient.get<Match[]>(`/tournaments/${tournamentId}/matches`);
  
  return handleApiError<Match[]>(data, error);
};

// 4. Get upcoming matches
export const getUpcomingMatches = async () => {
  if (MOCK_MODE) {
    await delay(300);
    const upcoming = mockMatches.filter(m => m.status === 'scheduled');
    return handleApiError<Match[]>(upcoming, null);
  }

  const { data, error } = await apiClient.get<Match[]>('/matches/upcoming');
  
  return handleApiError<Match[]>(data, error);
};

// 5. Get live matches
export const getLiveMatches = async () => {
  if (MOCK_MODE) {
    await delay(300);
    const live = mockMatches.filter(m => m.status === 'live');
    return handleApiError<Match[]>(live, null);
  }

  const { data, error } = await apiClient.get<Match[]>('/matches/live');
  
  return handleApiError<Match[]>(data, error);
};

// 6. Update match status
export const updateMatchStatus = async (matchId: string, status: MatchStatus) => {
  if (MOCK_MODE) {
    await delay(500);
    const match = mockMatches.find(m => m.id === matchId);
    if (match) {
      match.status = status;
    }
    return handleApiError<Match>(match || mockMatches[0], null);
  }

  const { data, error } = await apiClient.patch<Match>(`/matches/${matchId}/status`, { status });
  
  return handleApiError<Match>(data, error);
};

// 7. Request scoring permission
export const requestScoring = async (matchId: string, captainId: string) => {
  if (MOCK_MODE) {
    await delay(500);
    const match = mockMatches.find(m => m.id === matchId);
    if (match) {
      match.scoring_captain_id = captainId;
    }
    return handleApiError<Match>(match || mockMatches[0], null);
  }

  const { data, error } = await apiClient.post<Match>(`/matches/${matchId}/scoring/request`, {
    captain_id: captainId,
  });
  
  return handleApiError<Match>(data, error);
};

// 8. Approve scoring
export const approveScoring = async (matchId: string, approvingCaptainId: string) => {
  if (MOCK_MODE) {
    await delay(500);
    const match = mockMatches.find(m => m.id === matchId);
    if (match) {
      match.approved_by_captain_id = approvingCaptainId;
    }
    return handleApiError<Match>(match || mockMatches[0], null);
  }

  const { data, error } = await apiClient.post<Match>(`/matches/${matchId}/scoring/approve`, {
    captain_id: approvingCaptainId,
  });
  
  return handleApiError<Match>(data, error);
};

// 9. Submit match score (Initial or final)
export const submitMatchScore = async (matchId: string, scoreData: ScoringFormData) => {
  if (MOCK_MODE) {
    await delay(500);
    const newScore: MatchScore = {
      id: Date.now().toString(),
      match_id: matchId,
      ...scoreData,
      created_at: new Date().toISOString(),
    };
    return handleApiError<MatchScore>(newScore, null);
  }

  const { data, error } = await apiClient.post<MatchScore>(`/matches/${matchId}/scores`, scoreData);
  
  return handleApiError<MatchScore>(data, error);
};

// 10. Get match score
export const getMatchScore = async (matchId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const scores = mockMatchScores.filter(s => s.match_id === matchId);
    return handleApiError<MatchScore[]>(scores, null);
  }

  const { data, error } = await apiClient.get<MatchScore[]>(`/matches/${matchId}/scores`);
  
  return handleApiError<MatchScore[]>(data, error);
};

// 11. Update live score
export const updateLiveScore = async (matchId: string, scoreData: ScoringFormData) => {
  if (MOCK_MODE) {
    await delay(500);
    let score = mockMatchScores.find(s => s.match_id === matchId && s.batting_team_id === scoreData.batting_team_id);
    if (!score) {
      // Create new score if doesn't exist
      score = {
        id: Date.now().toString(),
        match_id: matchId,
        batting_team_id: scoreData.batting_team_id,
        total_runs: scoreData.total_runs,
        total_wickets: scoreData.total_wickets,
        total_overs: scoreData.total_overs,
        extras: scoreData.extras,
      };
      mockMatchScores.push(score);
    } else {
      // Update existing score
      score.total_runs = scoreData.total_runs;
      score.total_wickets = scoreData.total_wickets;
      score.total_overs = scoreData.total_overs;
      score.extras = scoreData.extras;
    }
    return handleApiError<MatchScore>(score, null);
  }

  const { data, error } = await apiClient.patch<MatchScore>(
    `/matches/${matchId}/scores/live`,
    scoreData
  );
  
  return handleApiError<MatchScore>(data, error);
};

// 12. Complete match
export const completeMatch = async (matchId: string, winnerTeamId: string) => {
  if (MOCK_MODE) {
    await delay(500);
    const match = mockMatches.find(m => m.id === matchId);
    if (match) {
      match.status = 'completed';
      match.winner_team_id = winnerTeamId;
    }
    return handleApiError<Match>(match || mockMatches[0], null);
  }

  const { data, error } = await apiClient.patch<Match>(`/matches/${matchId}/complete`, {
    winner_team_id: winnerTeamId,
  });
  
  return handleApiError<Match>(data, error);
};
