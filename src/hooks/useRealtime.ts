import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { MatchScore, Match, TeamMember } from '../types/database.types';

// Subscribe to live score updates
export const useRealtimeMatchScore = (matchId?: string) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!matchId) return;

        const channel = supabase
            .channel(`match-score-${matchId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'match_scores',
                    filter: `match_id=eq.${matchId}`,
                },
                (payload) => {
                    // Update the cache immediately with the new payload
                    queryClient.setQueryData(['matchScore', matchId], (oldData: MatchScore[] | undefined) => {
                        // Logic depending on if it's an insert or update.
                        // As match_scores usually 1:1 or 1:N per match, complex logic might be needed if multiple scores.
                        // Assuming simplified update for single current score or a list replacement
                        // For now, simple invalidation is safer if list structure is complex, 
                        // but setting data is better for performance.
                        // Let's just invalidate for correctness unless payload structure is strictly handled.
                        queryClient.invalidateQueries({ queryKey: ['matchScore', matchId] });
                        return oldData;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [matchId, queryClient]);
};

// Subscribe to match status changes
export const useRealtimeMatchStatus = (matchId?: string) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!matchId) return;

        const channel = supabase
            .channel(`match-status-${matchId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'matches',
                    filter: `id=eq.${matchId}`,
                },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['match', matchId] });
                    // Also optionally update status in list views
                    queryClient.invalidateQueries({ queryKey: ['matches', 'live'] });
                    queryClient.invalidateQueries({ queryKey: ['matches', 'upcoming'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [matchId, queryClient]);
};

// Subscribe to join requests
export const useRealtimeJoinRequests = (teamId?: string) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!teamId) return;

        const channel = supabase
            .channel(`team-requests-${teamId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT', // Only care about new requests usually, or updates if status changes
                    schema: 'public',
                    table: 'team_members',
                    filter: `team_id=eq.${teamId}`,
                },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['teamRequests', teamId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [teamId, queryClient]);
};
