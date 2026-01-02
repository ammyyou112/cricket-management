import { apiClient, handleApiError } from '../apiClient';
import { Team, TeamMember, User } from '../../types/database.types';
import { TeamFormData } from '../../types/forms.types';
import { mockTeams, mockTeamMembers, mockUsers, delay } from '../mockData';

// MOCK MODE: Set to true for frontend testing without backend
const MOCK_MODE = false;

// 1. Create new team
export const createTeam = async (teamData: TeamFormData, captainId: string) => {
  if (MOCK_MODE) {
    await delay(500);
    const newTeam: Team = {
      id: Date.now().toString(),
      ...teamData,
      captain_id: captainId,
      created_at: new Date().toISOString(),
    };
    return handleApiError<Team>(newTeam, null);
  }

  const { data, error } = await apiClient.post<Team>('/teams', {
    ...teamData,
    captain_id: captainId,
  });
  
  return handleApiError<Team>(data, error);
};

// 2. Get team info
export const getTeamDetails = async (teamId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const team = mockTeams.find(t => t.id === teamId) || mockTeams[0];
    const captain = mockUsers.find(u => u.id === team.captain_id) || mockUsers[1];
    return handleApiError<Team & { captain: User }>({ ...team, captain }, null);
  }

  const { data, error } = await apiClient.get<Team & { captain: User }>(`/teams/${teamId}`);
  
  return handleApiError<Team & { captain: User }>(data, error);
};

// 3. Get squad list
export const getTeamMembers = async (teamId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const members = mockTeamMembers
      .filter(m => m.team_id === teamId && m.status === 'active')
      .map(m => ({
        ...m,
        player: mockUsers.find(u => u.id === m.player_id) || mockUsers[0],
      }));
    return handleApiError<(TeamMember & { player: User })[]>(members, null);
  }

  const { data, error } = await apiClient.get<(TeamMember & { player: User })[]>(
    `/teams/${teamId}/members`
  );
  
  return handleApiError<(TeamMember & { player: User })[]>(data, error);
};

// 4. Update team info
export const updateTeam = async (teamId: string, data: Partial<Team>) => {
  if (MOCK_MODE) {
    await delay(500);
    const team = mockTeams.find(t => t.id === teamId) || mockTeams[0];
    const updated = { ...team, ...data };
    return handleApiError<Team>(updated, null);
  }

  const { data: updatedTeam, error } = await apiClient.patch<Team>(`/teams/${teamId}`, data);
  
  return handleApiError<Team>(updatedTeam, error);
};

// 5. Delete team
export const deleteTeam = async (teamId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    return handleApiError(null, null);
  }

  const { error } = await apiClient.delete(`/teams/${teamId}`);
  
  return handleApiError(null, error);
};

// 6. Get all teams
export const getAvailableTeams = async () => {
  if (MOCK_MODE) {
    await delay(300);
    return handleApiError<Team[]>(mockTeams, null);
  }

  const { data, error } = await apiClient.get<Team[]>('/teams');
  
  return handleApiError<Team[]>(data, error);
};

// 7. Get teams player has joined
export const getMyTeams = async (playerId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const playerTeams = mockTeamMembers
      .filter(m => m.player_id === playerId && m.status === 'active')
      .map(m => mockTeams.find(t => t.id === m.team_id))
      .filter(Boolean) as Team[];
    return handleApiError<Team[]>(playerTeams, null);
  }

  const { data, error } = await apiClient.get<Team[]>(`/players/${playerId}/teams`);
  
  return handleApiError<Team[]>(data, error);
};

// 8. Request to join
export const sendJoinRequest = async (playerId: string, teamId: string) => {
  if (MOCK_MODE) {
    await delay(500);
    const newRequest: TeamMember = {
      id: Date.now().toString(),
      player_id: playerId,
      team_id: teamId,
      status: 'pending',
      joined_at: new Date().toISOString(),
      is_temporary: false,
    };
    return handleApiError<TeamMember>(newRequest, null);
  }

  const { data, error } = await apiClient.post<TeamMember>('/teams/requests', {
    player_id: playerId,
    team_id: teamId,
  });
  
  return handleApiError<TeamMember>(data, error);
};

// 9. Approve request
export const approveJoinRequest = async (requestId: string, captainId: string) => {
  if (MOCK_MODE) {
    await delay(500);
    const request = mockTeamMembers.find(m => m.id === requestId);
    if (request) {
      request.status = 'active';
    }
    return handleApiError<TeamMember>(request || mockTeamMembers[0], null);
  }

  const { data, error } = await apiClient.patch<TeamMember>(`/teams/requests/${requestId}/approve`, {
    captain_id: captainId,
  });
  
  return handleApiError<TeamMember>(data, error);
};

// 10. Reject request
export const rejectJoinRequest = async (requestId: string, captainId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    return handleApiError(null, null);
  }

  const { error } = await apiClient.delete(`/teams/requests/${requestId}`);
  
  return handleApiError(null, error);
};

// 11. Invite player
export const invitePlayer = async (captainId: string, playerId: string, teamId: string) => {
  if (MOCK_MODE) {
    await delay(500);
    const newInvite: TeamMember = {
      id: Date.now().toString(),
      player_id: playerId,
      team_id: teamId,
      status: 'invited',
      joined_at: new Date().toISOString(),
      is_temporary: false,
    };
    return handleApiError<TeamMember>(newInvite, null);
  }

  const { data, error } = await apiClient.post<TeamMember>(`/teams/${teamId}/invite`, {
    userId: playerId,
  });
  
  return handleApiError<TeamMember>(data, error);
};

// 12. Remove player from team
export const removePlayerFromTeam = async (teamId: string, playerId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    return handleApiError(null, null);
  }

  const { error } = await apiClient.delete(`/teams/${teamId}/members/${playerId}`);
  
  return handleApiError(null, error);
};

// 13. Get pending requests (for captain)
export const getTeamRequests = async (teamId: string) => {
  if (MOCK_MODE) {
    await delay(300);
    const requests = mockTeamMembers
      .filter(m => m.team_id === teamId && m.status === 'pending')
      .map(m => ({
        ...m,
        player: mockUsers.find(u => u.id === m.player_id) || mockUsers[0],
      }));
    return handleApiError<(TeamMember & { player: User })[]>(requests, null);
  }

  const { data, error } = await apiClient.get<(TeamMember & { player: User })[]>(
    `/teams/${teamId}/requests`
  );
  
  return handleApiError<(TeamMember & { player: User })[]>(data, error);
};

// 14. Temp hire
export const hireTemporaryPlayer = async (teamId: string, playerId: string, matchId: string) => {
  if (MOCK_MODE) {
    await delay(500);
    const tempHire: TeamMember = {
      id: Date.now().toString(),
      team_id: teamId,
      player_id: playerId,
      status: 'active',
      is_temporary: true,
      joined_at: new Date().toISOString(),
    };
    return handleApiError<TeamMember>(tempHire, null);
  }

  const { data, error } = await apiClient.post<TeamMember>('/teams/temporary-hire', {
    team_id: teamId,
    player_id: playerId,
    match_id: matchId,
  });
  
  return handleApiError<TeamMember>(data, error);
};
