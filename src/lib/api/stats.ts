import { supabase, handleSupabaseError } from '../supabase';
import { PlayerStats } from '../../types/database.types';

// 1. Get player aggregated statistics
export const getPlayerStats = async (playerId: string) => {
    // Assuming a view 'player_stats_summary' exists for ease, or we query raw stats
    // For now, let's query raw stats and return them. Aggregation usually happens in a view or client side.
    const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', playerId);

    return handleSupabaseError<PlayerStats[]>(data, error);
};

// 2. Get team statistics
export const getTeamStats = async (teamId: string) => {
    // Similar to player stats, we'd look for a view or aggregate match_scores.
    // Fetching match scores for now.
    const { data, error } = await supabase
        .from('match_scores')
        .select(`
      *,
      matches (winner_team_id)
    `)
        .eq('batting_team_id', teamId);

    return handleSupabaseError(data, error);
};

// 3. Get tournament stats
export const getTournamentStats = async (tournamentId: string) => {
    // Fetch overall tournament stats (e.g. total runs, wickets, high scores)
    // This is complex without specific views, so we'll fetch matches and scores
    const { data, error } = await supabase
        .from('match_scores')
        .select(`
      *,
      matches!inner (
        id,
        tournament_id
      )
    `)
        .eq('matches.tournament_id', tournamentId);

    return handleSupabaseError(data, error);
};

// 4. Get leaderboard
export const getLeaderboard = async (type: 'runs' | 'wickets' | 'matches') => {
    let orderByColumn = 'runs_scored';
    if (type === 'wickets') orderByColumn = 'wickets_taken';
    if (type === 'matches') orderByColumn = 'matches_played'; // Assuming this exists or we count

    // Ideally, use a view: 'leaderboard'
    // .from('leaderboard')
    // .select('*')
    // .order(orderByColumn, { ascending: false })
    // .limit(10);

    // Simulated raw query fallback
    const { data, error } = await supabase
        .from('player_stats')
        .select(`
      player_id,
      runs_scored,
      wickets_taken
    `)
        // .order(...) // this won't aggregate without a view
        .limit(50); // Just fetch data, client aggregates for now without advanced SQL access

    return handleSupabaseError(data, error);
};

// 5. Get recent form
export const getPlayerForm = async (playerId: string, lastNMatches: number = 5) => {
    const { data, error } = await supabase
        .from('player_stats')
        .select(`
      runs_scored,
      wickets_taken,
      matches!inner (
        match_date,
        status,
        winner_team_id
      )
    `)
        .eq('player_id', playerId)
        .order('matches(match_date)', { ascending: false })
        .limit(lastNMatches);

    return handleSupabaseError(data, error);
};
