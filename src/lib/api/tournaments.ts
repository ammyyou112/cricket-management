import { supabase, handleSupabaseError } from '../supabase';
import { Tournament, Match, TournamentStatus } from '../../types/database.types';
import { TournamentFormData } from '../../types/forms.types';

// 1. Create tournament
export const createTournament = async (tournamentData: TournamentFormData, adminId: string) => {
    const { data, error } = await supabase
        .from('tournaments')
        .insert({
            ...tournamentData,
            created_by: adminId,
            created_at: new Date().toISOString(),
        })
        .select()
        .single();

    return handleSupabaseError<Tournament>(data, error);
};

// 2. Get all/filtered tournaments
export const getTournaments = async (status?: TournamentStatus) => {
    let query = supabase
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: true });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;
    return handleSupabaseError<Tournament[]>(data, error);
};

// 3. Get specific tournament
export const getTournamentDetails = async (tournamentId: string) => {
    const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

    return handleSupabaseError<Tournament>(data, error);
};

// 4. Update tournament
export const updateTournament = async (tournamentId: string, data: Partial<Tournament>) => {
    const { data: updatedTournament, error } = await supabase
        .from('tournaments')
        .update(data)
        .eq('id', tournamentId)
        .select()
        .single();

    return handleSupabaseError<Tournament>(updatedTournament, error);
};

// 5. Delete tournament
export const deleteTournament = async (tournamentId: string) => {
    const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId);

    return handleSupabaseError(null, error);
};

// 6. Get all matches for a tournament
export const getTournamentMatches = async (tournamentId: string) => {
    const { data, error } = await supabase
        .from('matches')
        .select(`
      *,
      team_a:teams!matches_team_a_id_fkey (id, team_name, logo_url),
      team_b:teams!matches_team_b_id_fkey (id, team_name, logo_url)
    `)
        .eq('tournament_id', tournamentId)
        .order('match_date', { ascending: true });

    return handleSupabaseError<Match[]>(data, error);
};

// 7. Get team standings (This usually requires a complex query or a view. Mocking structure for now or simple calculation)
// Assuming we calculate it client-side or fetch from a 'standings' table/view if it existed.
// Here we might just return empty or implement a basic fetch if there's a view.
export const getTournamentStandings = async (tournamentId: string) => {
    // If you have a view or table:
    // const { data, error } = await supabase.from('tournament_standings').select('*').eq('tournament_id', tournamentId);

    // For now, let's just return matches so client can calculate, or return null if not implemented.
    // Ideally, you'd use a SQL View for this.
    const { data, error } = await supabase
        .from('matches')
        .select('winner_team_id, status')
        .eq('tournament_id', tournamentId)
        .eq('status', 'completed');

    if (error) return handleSupabaseError(null, error);

    // Client-side calculation logic would go here or in the component
    return { data, error: null };
};
