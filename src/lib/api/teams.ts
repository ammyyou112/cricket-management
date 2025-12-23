import { supabase, handleSupabaseError } from '../supabase';
import { Team, TeamMember, User } from '../../types/database.types';
import { TeamFormData } from '../../types/forms.types';

// 1. Create new team
export const createTeam = async (teamData: TeamFormData, captainId: string) => {
    const { data, error } = await supabase
        .from('teams')
        .insert({
            ...teamData,
            captain_id: captainId,
            created_at: new Date().toISOString(),
        })
        .select()
        .single();

    return handleSupabaseError<Team>(data, error);
};

// 2. Get team info
export const getTeamDetails = async (teamId: string) => {
    const { data, error } = await supabase
        .from('teams')
        .select(`
      *,
      captain:users!teams_captain_id_fkey (*)
    `)
        .eq('id', teamId)
        .single();

    return handleSupabaseError<Team & { captain: User }>(data, error);
};

// 3. Get squad list
export const getTeamMembers = async (teamId: string) => {
    const { data, error } = await supabase
        .from('team_members')
        .select(`
      *,
      player:users (*)
    `)
        .eq('team_id', teamId)
        .eq('status', 'active');

    return handleSupabaseError<(TeamMember & { player: User })[]>(data, error);
};

// 4. Update team info
export const updateTeam = async (teamId: string, data: Partial<Team>) => {
    const { data: updatedTeam, error } = await supabase
        .from('teams')
        .update(data)
        .eq('id', teamId)
        .select()
        .single();

    return handleSupabaseError<Team>(updatedTeam, error);
};

// 5. Delete team
export const deleteTeam = async (teamId: string) => {
    const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

    return handleSupabaseError(null, error);
};

// 6. Get all teams
export const getAvailableTeams = async () => {
    const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

    return handleSupabaseError<Team[]>(data, error);
};

// 7. Get teams player has joined
export const getMyTeams = async (playerId: string) => {
    const { data, error } = await supabase
        .from('team_members')
        .select(`
      team:teams (*)
    `)
        .eq('player_id', playerId)
        .eq('status', 'active');

    // Flatten the response to return just the teams
    const userTeams = data?.map((item: any) => item.team) || [];

    return handleSupabaseError<Team[]>(userTeams, error);
};

// 8. Request to join
export const sendJoinRequest = async (playerId: string, teamId: string) => {
    const { data, error } = await supabase
        .from('team_members')
        .insert({
            player_id: playerId,
            team_id: teamId,
            status: 'pending',
            joined_at: new Date().toISOString(),
            is_temporary: false
        })
        .select()
        .single();

    return handleSupabaseError<TeamMember>(data, error);
};

// 9. Approve request
export const approveJoinRequest = async (requestId: string, captainId: string) => {
    // Verify captain ownership logic should ideally be here or RLS
    const { data, error } = await supabase
        .from('team_members')
        .update({ status: 'active' })
        .eq('id', requestId)
        .select()
        .single();

    return handleSupabaseError<TeamMember>(data, error);
};

// 10. Reject request
export const rejectJoinRequest = async (requestId: string, captainId: string) => {
    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', requestId);

    return handleSupabaseError(null, error);
};

// 11. Invite player
export const invitePlayer = async (captainId: string, playerId: string, teamId: string) => {
    const { data, error } = await supabase
        .from('team_members')
        .insert({
            player_id: playerId,
            team_id: teamId,
            status: 'invited',
            joined_at: new Date().toISOString(),
            is_temporary: false // Assuming regular invite is not temporary by default
        })
        .select()
        .single();

    return handleSupabaseError<TeamMember>(data, error);
};

// 12. Remove player from team
export const removePlayerFromTeam = async (teamId: string, playerId: string) => {
    const { error } = await supabase
        .from('team_members')
        .delete()
        .match({ team_id: teamId, player_id: playerId });

    return handleSupabaseError(null, error);
};

// 13. Get pending requests (for captain)
export const getTeamRequests = async (teamId: string) => {
    const { data, error } = await supabase
        .from('team_members')
        .select(`
      *,
      player:users (*)
    `)
        .eq('team_id', teamId)
        .eq('status', 'pending');

    return handleSupabaseError<(TeamMember & { player: User })[]>(data, error);
};

// 14. Temp hire
export const hireTemporaryPlayer = async (teamId: string, playerId: string, matchId: string) => {
    // Note: matchId might need to be stored if temp hire is match specific. 
    // Assuming the schema supports it or we just mark them temporary in the team for now.
    // If TeamMember doesn't support match_id, you might need a separate table or handle it logically.
    // For now, adhering to TeamMember type which has is_temporary.
    const { data, error } = await supabase
        .from('team_members')
        .insert({
            team_id: teamId,
            player_id: playerId,
            status: 'active',
            is_temporary: true,
            joined_at: new Date().toISOString(),
            // match_id: matchId // If you add this column to TeamMember type later
        })
        .select()
        .single();

    return handleSupabaseError<TeamMember>(data, error);
};
