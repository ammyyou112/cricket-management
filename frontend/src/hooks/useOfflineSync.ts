import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/ui/use-toast';
import { useOfflineDetection } from './useOfflineDetection';
import {
  getPendingScores,
  getPendingMatchUpdates,
  markScoreAsSynced,
  markMatchUpdateAsSynced,
  getPendingScoresCount,
  getPendingMatchUpdatesCount
} from '../lib/offlineStorage';
import * as matchApi from '../lib/api/matches';
import { ScoringFormData } from '../types/forms.types';

/**
 * Hook to automatically sync pending offline scores when connection is restored
 */
export const useOfflineSync = () => {
  const { isOnline, justCameOnline } = useOfflineDetection();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Update pending count periodically
  useEffect(() => {
    const updatePendingCount = async () => {
      const scoresCount = await getPendingScoresCount();
      const updatesCount = await getPendingMatchUpdatesCount();
      setPendingCount(scoresCount + updatesCount);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && justCameOnline && !isSyncing) {
      syncPendingData();
    }
  }, [isOnline, justCameOnline]);

  const syncPendingData = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    
    try {
      // Get pending scores
      const pendingScores = await getPendingScores();
      const pendingUpdates = await getPendingMatchUpdates();

      const totalPending = pendingScores.length + pendingUpdates.length;

      if (totalPending === 0) {
        setIsSyncing(false);
        return;
      }

      // Show sync notification
      toast({
        title: 'Syncing offline data',
        description: `Syncing ${totalPending} pending update${totalPending > 1 ? 's' : ''}...`,
      });

      let syncedCount = 0;
      let failedCount = 0;

      // Sync scores
      for (const pendingScore of pendingScores) {
        try {
          await matchApi.updateLiveScore(pendingScore.matchId, pendingScore.scoreData);
          await markScoreAsSynced(pendingScore.id!);
          syncedCount++;
        } catch (error) {
          console.error('Failed to sync score:', error);
          failedCount++;
        }
      }

      // Sync match updates
      for (const pendingUpdate of pendingUpdates) {
        try {
          if (pendingUpdate.updateType === 'status') {
            await matchApi.updateMatchStatus(
              pendingUpdate.matchId,
              pendingUpdate.updateData.status
            );
          } else if (pendingUpdate.updateType === 'complete') {
            await matchApi.completeMatch(
              pendingUpdate.matchId,
              pendingUpdate.updateData.winnerTeamId
            );
          }
          await markMatchUpdateAsSynced(pendingUpdate.id!);
          syncedCount++;
        } catch (error) {
          console.error('Failed to sync match update:', error);
          failedCount++;
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['matchScore'] });
      queryClient.invalidateQueries({ queryKey: ['match'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });

      // Update pending count
      const newPendingCount = await getPendingScoresCount() + await getPendingMatchUpdatesCount();
      setPendingCount(newPendingCount);

      // Show result
      if (failedCount === 0) {
        toast({
          title: 'Sync complete',
          description: `Successfully synced ${syncedCount} update${syncedCount > 1 ? 's' : ''}.`,
        });
      } else {
        toast({
          title: 'Sync partially complete',
          description: `Synced ${syncedCount} update${syncedCount > 1 ? 's' : ''}, ${failedCount} failed.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error during sync:', error);
      toast({
        title: 'Sync failed',
        description: 'Failed to sync offline data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    pendingCount,
    syncPendingData
  };
};

