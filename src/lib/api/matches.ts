import { supabase, handleSupabaseError } from '../supabase';
import { Match, MatchScore, MatchStatus } from '../../types/database.types';
import { MatchFormData, ScoringFormData } from '../../types/forms.types';

// 1. Schedule match
export const createMatch = async (matchData: MatchFormData, adminId: string) => {
    // adminId might be used for logs or validation, but currently not stored in match schema directly based on previous types.
    const { data, error } = await supabase
        .from('matches')
        .insert(matchData)
        .select()
        .single();

    return handleSupabaseError<Match>(data, error);
};

// 2. Get match details
export const getMatch = async (matchId: string) => {
    const { data, error } = await supabase
        .from('matches')
        .select(`
      *,
      team_a:teams!matches_team_a_id_fkey (*),
      team_b:teams!matches_team_b_id_fkey (*),
      tournament:tournaments (*)
    `)
        .eq('id', matchId)
        .single();

    return handleSupabaseError<Match>(data, error);
};

// 3. Get matches by tournament (Already in tournaments.ts, but can duplicate or reference)
export const getMatchesByTournament = async (tournamentId: string) => {
    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('match_date', { ascending: true });

    return handleSupabaseError<Match[]>(data, error);
};

// 4. Get upcoming matches
export const getUpcomingMatches = async () => {
    const { data, error } = await supabase
        .from('matches')
        .select(`
      *,
      team_a:teams!matches_team_a_id_fkey (team_name, logo_url),
      team_b:teams!matches_team_b_id_fkey (team_name, logo_url)
    `)
        .eq('status', 'scheduled')
        .order('match_date', { ascending: true })
        .limit(10); // Limit to next 10

    return handleSupabaseError<Match[]>(data, error);
};

// 5. Get live matches
export const getLiveMatches = async () => {
    const { data, error } = await supabase
        .from('matches')
        .select(`
      *,
      team_a:teams!matches_team_a_id_fkey (team_name, logo_url),
      team_b:teams!matches_team_b_id_fkey (team_name, logo_url)
    `)
        .eq('status', 'live');

    return handleSupabaseError<Match[]>(data, error);
};

// 6. Update match status
export const updateMatchStatus = async (matchId: string, status: MatchStatus) => {
    const { data, error } = await supabase
        .from('matches')
        .update({ status })
        .eq('id', matchId)
        .select()
        .single();

    return handleSupabaseError<Match>(data, error);
};

// 7. Request scoring permission
export const requestScoring = async (matchId: string, captainId: string) => {
    const { data, error } = await supabase
        .from('matches')
        .update({ scoring_captain_id: captainId })
        .eq('id', matchId)
        .select()
        .single();

    return handleSupabaseError<Match>(data, error);
};

// 8. Approve scoring
export const approveScoring = async (matchId: string, approvingCaptainId: string) => {
    const { data, error } = await supabase
        .from('matches')
        .update({ approved_by_captain_id: approvingCaptainId })
        .eq('id', matchId)
        .select()
        .single();

    return handleSupabaseError<Match>(data, error);
};

// 9. Submit match score (Initial or final)
export const submitMatchScore = async (matchId: string, scoreData: ScoringFormData) => {
    const { data, error } = await supabase
        .from('match_scores')
        .insert({
            match_id: matchId,
            ...scoreData
        })
        .select()
        .single();

    return handleSupabaseError<MatchScore>(data, error);
};

// 10. Get match score
export const getMatchScore = async (matchId: string) => {
    const { data, error } = await supabase
        .from('match_scores')
        .select('*')
        .eq('match_id', matchId);

    return handleSupabaseError<MatchScore[]>(data, error);
};

// 11. Update live score
export const updateLiveScore = async (matchId: string, scoreData: ScoringFormData) => {
    // Assuming we are updating an existing score record for the batting team
    const { data, error } = await supabase
        .from('match_scores')
        .update(scoreData)
        .match({ match_id: matchId, batting_team_id: scoreData.batting_team_id })
        .select()
        .single();

    return handleSupabaseError<MatchScore>(data, error);
};

// 12. Complete match
export const completeMatch = async (matchId: string, winnerTeamId: string) => {
    const { data, error } = await supabase
        .from('matches')
        .update({
            status: 'completed',
            winner_team_id: winnerTeamId
        })
        .eq('id', matchId)
        .select()
        .single();

    return handleSupabaseError<Match>(data, error);
};
