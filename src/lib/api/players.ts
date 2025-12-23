import { supabase, handleSupabaseError } from '../supabase';
import { User, PlayerStats } from '../../types/database.types';

/**
 * Get player profile details by user ID.
 * @param userId - The ID of the user (player).
 * @returns User profile data or an error.
 */
export const getPlayerProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    return handleSupabaseError<User>(data, error);
};

/**
 * Update player profile information.
 * @param userId - The ID of the user to update.
 * @param data - The partial data to update.
 * @returns Updated user profile or an error.
 */
export const updatePlayerProfile = async (userId: string, data: Partial<User>) => {
    const { data: updatedData, error } = await supabase
        .from('users')
        .update(data)
        .eq('id', userId)
        .select()
        .single();

    return handleSupabaseError<User>(updatedData, error);
};

/**
 * Get aggregated player statistics.
 * Note: This assumes we are aggregating from the 'player_stats' table.
 * If you need to sum them up, we might need a different query or a database view.
 * For now, this fetches all stats records.
 * @param userId - The ID of the player.
 * @returns List of stats records or an error.
 */
export const getPlayerStats = async (userId: string) => {
    // Using a raw query or aggregation if Supabase supports it via Views or RPC would be better for totals.
    // Here we fetch the individual match stats.
    const { data, error } = await supabase
        .from('player_stats')
        .select(`
      *,
      matches (
        match_date,
        venue,
        tournament_id
      )
    `)
        .eq('player_id', userId);

    return handleSupabaseError<PlayerStats[]>(data, error);
};

/**
 * Get partial match history for a player.
 * @param userId - The player's ID.
 * @returns List of matches the player has participated in (via stats or team membership).
 */
export const getPlayerMatchHistory = async (userId: string) => {
    // Assuming participation is tracked via stats entry for now
    const { data, error } = await supabase
        .from('player_stats')
        .select(`
      match_id,
      runs_scored,
      wickets_taken,
      catches,
      matches (
        id,
        match_date,
        venue,
        status,
        team_a_id,
        team_b_id,
        winner_team_id
      )
    `)
        .eq('player_id', userId)
        .order('matches(match_date)', { ascending: false });

    return handleSupabaseError(data, error);
};

/**
 * Get all registered players.
 * Filters users by role 'player'.
 * @returns List of all players.
 */
export const getAllPlayers = async () => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'player')
        .order('full_name');

    return handleSupabaseError<User[]>(data, error);
};

/**
 * Search players by name.
 * @param query - The search string.
 * @returns List of matching players.
 */
export const searchPlayers = async (query: string) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'player')
        .ilike('full_name', `%${query}%`)
        .limit(10);

    return handleSupabaseError<User[]>(data, error);
};
