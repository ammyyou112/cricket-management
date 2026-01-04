/**
 * Statistics Service
 * Business logic for calculating player statistics
 */

import { prisma } from '@/config/database';
import { NotFoundError } from '@/utils/errors';

export interface PlayerStatsSummary {
  totalMatches: number;
  totalRuns: number;
  totalWickets: number;
  totalCatches: number;
  totalStumpings: number;
  battingAverage: number;
  highestScore: number;
  bestBowling: string; // Format: "X/Y" (wickets/runs)
  strikeRate: number;
  economyRate: number;
  fifties: number;
  hundreds: number;
  threePlusWickets: number;
}

export class StatsService {
  /**
   * Get player statistics summary
   * Calculates aggregated stats from player_stats table
   */
  static async getPlayerStatsSummary(playerId: string): Promise<PlayerStatsSummary> {
    // Fetch all player stats
    const stats = await prisma.playerStat.findMany({
      where: { playerId },
      include: {
        match: {
          select: {
            matchDate: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (stats.length === 0) {
      // Return zeros if no stats
      return {
        totalMatches: 0,
        totalRuns: 0,
        totalWickets: 0,
        totalCatches: 0,
        totalStumpings: 0,
        battingAverage: 0,
        highestScore: 0,
        bestBowling: '0/0',
        strikeRate: 0,
        economyRate: 0,
        fifties: 0,
        hundreds: 0,
        threePlusWickets: 0,
      };
    }

    // Calculate aggregates
    const totalRuns = stats.reduce((sum, s) => sum + (s.runsScored || 0), 0);
    const totalWickets = stats.reduce((sum, s) => sum + (s.wicketsTaken || 0), 0);
    const totalCatches = stats.reduce((sum, s) => sum + (s.catches || 0), 0);
    const totalStumpings = stats.reduce((sum, s) => sum + (s.stumpings || 0), 0);
    const totalMatches = stats.length;

    // Calculate batting average (runs per match)
    const battingAverage = totalMatches > 0 ? totalRuns / totalMatches : 0;

    // Highest score
    const highestScore = Math.max(...stats.map(s => s.runsScored || 0), 0);

    // Best bowling (wickets/runs)
    let bestBowlingWickets = 0;
    let bestBowlingRuns = 0;
    stats.forEach(s => {
      if (s.wicketsTaken > bestBowlingWickets || 
          (s.wicketsTaken === bestBowlingWickets && (s.runsConceded || 0) < bestBowlingRuns)) {
        bestBowlingWickets = s.wicketsTaken || 0;
        bestBowlingRuns = s.runsConceded || 0;
      }
    });
    const bestBowling = `${bestBowlingWickets}/${bestBowlingRuns}`;

    // Strike rate (runs per 100 balls)
    const totalBallsFaced = stats.reduce((sum, s) => sum + (s.ballsFaced || 0), 0);
    const strikeRate = totalBallsFaced > 0 ? (totalRuns / totalBallsFaced) * 100 : 0;

    // Economy rate (runs per over)
    const totalOversBowled = stats.reduce((sum, s) => sum + Number(s.oversBowled || 0), 0);
    const totalRunsConceded = stats.reduce((sum, s) => sum + (s.runsConceded || 0), 0);
    const economyRate = totalOversBowled > 0 ? totalRunsConceded / totalOversBowled : 0;

    // Milestones
    const fifties = stats.filter(s => (s.runsScored || 0) >= 50 && (s.runsScored || 0) < 100).length;
    const hundreds = stats.filter(s => (s.runsScored || 0) >= 100).length;
    const threePlusWickets = stats.filter(s => (s.wicketsTaken || 0) >= 3).length;

    return {
      totalMatches,
      totalRuns,
      totalWickets,
      totalCatches,
      totalStumpings,
      battingAverage: Math.round(battingAverage * 100) / 100, // Round to 2 decimals
      highestScore,
      bestBowling,
      strikeRate: Math.round(strikeRate * 100) / 100,
      economyRate: Math.round(economyRate * 100) / 100,
      fifties,
      hundreds,
      threePlusWickets,
    };
  }

  /**
   * Get detailed player stats (all match records)
   */
  static async getPlayerStats(playerId: string) {
    const stats = await prisma.playerStat.findMany({
      where: { playerId },
      include: {
        match: {
          select: {
            id: true,
            matchDate: true,
            venue: true,
            status: true,
            teamAId: true,
            teamBId: true,
          },
        },
        team: {
          select: {
            id: true,
            teamName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return stats;
  }
}
