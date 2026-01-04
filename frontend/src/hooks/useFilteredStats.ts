import { useMemo } from 'react';
import { StatsFilterCriteria } from '@/components/player/StatsFilters';
import { PlayerStats } from '@/types/database.types';

interface MatchData {
  match_date?: string;
  tournament_id?: string;
  venue?: string;
}

interface PlayerStatsWithMatch extends PlayerStats {
  matches?: MatchData;
}

export interface FilteredStatsResult {
  filteredStats: PlayerStatsWithMatch[];
  aggregates: {
    totalRuns: number;
    totalWickets: number;
    totalCatches: number;
    matchCount: number;
    battingAverage: string;
    wicketsPerMatch: string;
    highestScore: number;
    bestBowling: number;
    fifties: number;
    hundreds: number;
    threePlusWickets: number;
  };
}

export const useFilteredStats = (
  stats: PlayerStatsWithMatch[] | undefined,
  filters: StatsFilterCriteria
): FilteredStatsResult => {
  return useMemo(() => {
    if (!stats || stats.length === 0) {
      return {
        filteredStats: [],
        aggregates: {
          totalRuns: 0,
          totalWickets: 0,
          totalCatches: 0,
          matchCount: 0,
          battingAverage: '0.00',
          wicketsPerMatch: '0.00',
          highestScore: 0,
          bestBowling: 0,
          fifties: 0,
          hundreds: 0,
          threePlusWickets: 0,
        },
      };
    }

    let filteredStats = [...stats];

    // Filter by tournament
    if (filters.tournamentId) {
      filteredStats = filteredStats.filter((stat) => {
        const match = stat.matches as MatchData | undefined;
        return match?.tournament_id === filters.tournamentId;
      });
    }

    // Filter by date range
    if (filters.startDate) {
      filteredStats = filteredStats.filter((stat) => {
        const match = stat.matches as MatchData | undefined;
        if (!match?.match_date) return false;
        const matchDate = new Date(match.match_date);
        return matchDate >= filters.startDate!;
      });
    }

    if (filters.endDate) {
      filteredStats = filteredStats.filter((stat) => {
        const match = stat.matches as MatchData | undefined;
        if (!match?.match_date) return false;
        const matchDate = new Date(match.match_date);
        // Set end date to end of day for inclusive filtering
        const endDate = new Date(filters.endDate!);
        endDate.setHours(23, 59, 59, 999);
        return matchDate <= endDate;
      });
    }

    // Filter by match type (mock - would need match_type field in database)
    // For now, we'll skip this filter as it's not in the data structure
    // if (filters.matchType) {
    //   filteredStats = filteredStats.filter((stat) => {
    //     const match = stat.matches as MatchData | undefined;
    //     return match?.match_type === filters.matchType;
    //   });
    // }

    // Calculate aggregated stats - Handle both camelCase (from API) and snake_case (legacy)
    const totalRuns = filteredStats.reduce((sum, s: any) => sum + (s.runsScored || s.runs_scored || 0), 0);
    const totalWickets = filteredStats.reduce((sum, s: any) => sum + (s.wicketsTaken || s.wickets_taken || 0), 0);
    const totalCatches = filteredStats.reduce((sum, s: any) => sum + (s.catches || 0), 0);
    const matchCount = filteredStats.length;

    const battingAverage = matchCount > 0 ? (totalRuns / matchCount).toFixed(2) : '0.00';
    const wicketsPerMatch = matchCount > 0 ? (totalWickets / matchCount).toFixed(2) : '0.00';

    const highestScore = filteredStats.reduce(
      (max, curr: any) => Math.max(max, curr.runsScored || curr.runs_scored || 0),
      0
    );

    const bestBowling = filteredStats.reduce(
      (best, curr: any) => Math.max(best, curr.wicketsTaken || curr.wickets_taken || 0),
      0
    );

    const fifties = filteredStats.filter(
      (s: any) => {
        const runs = s.runsScored || s.runs_scored || 0;
        return runs >= 50 && runs < 100;
      }
    ).length;

    const hundreds = filteredStats.filter((s: any) => {
      const runs = s.runsScored || s.runs_scored || 0;
      return runs >= 100;
    }).length;

    const threePlusWickets = filteredStats.filter((s: any) => {
      const wickets = s.wicketsTaken || s.wickets_taken || 0;
      return wickets >= 3;
    }).length;

    return {
      filteredStats,
      aggregates: {
        totalRuns,
        totalWickets,
        totalCatches,
        matchCount,
        battingAverage,
        wicketsPerMatch,
        highestScore,
        bestBowling,
        fifties,
        hundreds,
        threePlusWickets,
      },
    };
  }, [stats, filters]);
};

