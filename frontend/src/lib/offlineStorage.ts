import Dexie, { Table } from 'dexie';
import { ScoringFormData } from '../types/forms.types';

export interface PendingScore {
  id?: number;
  matchId: string;
  scoreData: ScoringFormData;
  timestamp: number;
  synced: boolean;
}

export interface PendingMatchUpdate {
  id?: number;
  matchId: string;
  updateType: 'status' | 'complete';
  updateData: any;
  timestamp: number;
  synced: boolean;
}

class OfflineDatabase extends Dexie {
  pendingScores!: Table<PendingScore>;
  pendingMatchUpdates!: Table<PendingMatchUpdate>;

  constructor() {
    super('Cricket360Offline');
    this.version(1).stores({
      pendingScores: '++id, matchId, timestamp, synced',
      pendingMatchUpdates: '++id, matchId, timestamp, synced'
    });
  }
}

export const offlineDb = new OfflineDatabase();

/**
 * Save a score update to IndexedDB when offline
 */
export const saveOfflineScore = async (matchId: string, scoreData: ScoringFormData): Promise<void> => {
  await offlineDb.pendingScores.add({
    matchId,
    scoreData,
    timestamp: Date.now(),
    synced: false
  });
};

/**
 * Get all pending scores that haven't been synced
 */
export const getPendingScores = async (): Promise<PendingScore[]> => {
  return await offlineDb.pendingScores
    .where('synced')
    .equals(false)
    .toArray();
};

/**
 * Get pending scores for a specific match
 */
export const getPendingScoresForMatch = async (matchId: string): Promise<PendingScore[]> => {
  return await offlineDb.pendingScores
    .where('matchId')
    .equals(matchId)
    .filter(score => !score.synced)
    .toArray();
};

/**
 * Mark a pending score as synced
 */
export const markScoreAsSynced = async (id: number): Promise<void> => {
  await offlineDb.pendingScores.update(id, { synced: true });
};

/**
 * Clear all synced scores (cleanup)
 */
export const clearSyncedScores = async (): Promise<void> => {
  await offlineDb.pendingScores
    .where('synced')
    .equals(true)
    .delete();
};

/**
 * Get count of pending scores
 */
export const getPendingScoresCount = async (): Promise<number> => {
  return await offlineDb.pendingScores
    .where('synced')
    .equals(false)
    .count();
};

/**
 * Save a match update (status change, completion) to IndexedDB when offline
 */
export const saveOfflineMatchUpdate = async (
  matchId: string,
  updateType: 'status' | 'complete',
  updateData: any
): Promise<void> => {
  await offlineDb.pendingMatchUpdates.add({
    matchId,
    updateType,
    updateData,
    timestamp: Date.now(),
    synced: false
  });
};

/**
 * Get all pending match updates
 */
export const getPendingMatchUpdates = async (): Promise<PendingMatchUpdate[]> => {
  return await offlineDb.pendingMatchUpdates
    .where('synced')
    .equals(false)
    .toArray();
};

/**
 * Mark a pending match update as synced
 */
export const markMatchUpdateAsSynced = async (id: number): Promise<void> => {
  await offlineDb.pendingMatchUpdates.update(id, { synced: true });
};

/**
 * Clear all synced match updates
 */
export const clearSyncedMatchUpdates = async (): Promise<void> => {
  await offlineDb.pendingMatchUpdates
    .where('synced')
    .equals(true)
    .delete();
};

/**
 * Get count of pending match updates
 */
export const getPendingMatchUpdatesCount = async (): Promise<number> => {
  return await offlineDb.pendingMatchUpdates
    .where('synced')
    .equals(false)
    .count();
};

