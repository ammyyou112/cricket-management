import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MatchScore, Match, TeamMember } from '../types/database.types';

/**
 * @deprecated Realtime subscriptions are now handled by the backend.
 * Use polling or WebSocket connections through the backend API instead.
 * 
 * These hooks are kept for backward compatibility but will use polling as a fallback.
 */

// Subscribe to live score updates (using polling as fallback)
export const useRealtimeMatchScore = (matchId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!matchId) return;

    // Poll for updates every 2 seconds when match is live
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['matchScore', matchId] });
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [matchId, queryClient]);
};

// Subscribe to match status changes (using polling as fallback)
export const useRealtimeMatchStatus = (matchId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!matchId) return;

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'live'] });
      queryClient.invalidateQueries({ queryKey: ['matches', 'upcoming'] });
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [matchId, queryClient]);
};

// Subscribe to join requests (using polling as fallback)
export const useRealtimeJoinRequests = (teamId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!teamId) return;

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['teamRequests', teamId] });
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [teamId, queryClient]);
};
