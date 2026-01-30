/**
 * Statistics Service
 * Business logic for calculating player statistics
 */

import { prisma } from '@/config/database';
import { NotFoundError } from '@/utils/errors';
import { WicketType, AuditAction } from '@prisma/client';
import { auditService } from './audit.service';
import logger from '@/utils/logger';

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

  /**
   * Calculate and update player stats from ball records
   * Called when match is completed
   */
  static async calculateStatsFromBalls(matchId: string): Promise<void> {
    try {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          teamA: { select: { id: true } },
          teamB: { select: { id: true } }
        }
      });

      if (!match) {
        throw new NotFoundError('Match not found');
      }

      // Only calculate if match is completed
      if (match.status !== 'COMPLETED') {
        throw new Error('Can only calculate stats for completed matches');
      }

      // Get all balls for this match
      const balls = await prisma.ball.findMany({
        where: { matchId },
        orderBy: [
          { innings: 'asc' },
          { overNumber: 'asc' },
          { ballNumber: 'asc' }
        ]
      });

      if (balls.length === 0) {
        logger.warn(`No balls found for match ${matchId}, skipping stats calculation`);
        return;
      }

      // Calculate stats for each player
      const playerStatsMap = new Map<string, {
        playerId: string;
        teamId: string;
        runsScored: number;
        ballsFaced: number;
        fours: number;
        sixes: number;
        wicketsTaken: number;
        oversBowled: number;
        runsConceded: number;
        catches: number;
        stumpings: number;
        runOuts: number;
        isOut: boolean;
      }>();

      // Process each ball
      for (const ball of balls) {
        const innings = ball.innings;
        const battingTeamId = innings === 1 ? match.teamAId : match.teamBId;
        const bowlingTeamId = innings === 1 ? match.teamBId : match.teamAId;

        // Batsman stats (striker)
        const strikerStats = this.getOrCreatePlayerStats(
          playerStatsMap,
          ball.batsmanOnStrike,
          battingTeamId
        );
        strikerStats.ballsFaced += (ball.isWide || ball.isNoBall) ? 0 : 1;
        strikerStats.runsScored += ball.runs;
        if (ball.runs === 4) strikerStats.fours++;
        if (ball.runs === 6) strikerStats.sixes++;
        if (ball.isWicket && ball.dismissedPlayer === ball.batsmanOnStrike) {
          strikerStats.isOut = true;
        }

        // Bowler stats
        const bowlerStats = this.getOrCreatePlayerStats(
          playerStatsMap,
          ball.bowler,
          bowlingTeamId
        );
        if (!ball.isWide && !ball.isNoBall) {
          bowlerStats.oversBowled += 1 / 6; // Add 1 ball (1/6 of an over)
        }
        bowlerStats.runsConceded += ball.runs;
        if (ball.isWicket && ball.wicketType !== 'RUN_OUT' && ball.wicketType !== 'STUMPED') {
          bowlerStats.wicketsTaken++;
        }

        // Fielder stats (for catches, run outs, stumpings)
        if (ball.fielder) {
          const fielderStats = this.getOrCreatePlayerStats(
            playerStatsMap,
            ball.fielder,
            bowlingTeamId
          );
          if (ball.wicketType === 'CAUGHT') {
            fielderStats.catches++;
          } else if (ball.wicketType === 'RUN_OUT') {
            fielderStats.runOuts++;
          } else if (ball.wicketType === 'STUMPED') {
            fielderStats.stumpings++;
          }
        }
      }

      // Convert overs to decimal format (e.g., 2.3 = 2 overs 3 balls)
      for (const stats of playerStatsMap.values()) {
        stats.oversBowled = Math.floor(stats.oversBowled) + (stats.oversBowled % 1) * 0.1;
      }

      // Save stats to database
      await prisma.$transaction(async (tx: any) => {
        for (const [playerId, stats] of playerStatsMap.entries()) {
          await tx.playerStat.upsert({
            where: {
              playerId_matchId: {
                playerId: stats.playerId,
                matchId
              }
            },
            update: {
              runsScored: stats.runsScored,
              ballsFaced: stats.ballsFaced,
              fours: stats.fours,
              sixes: stats.sixes,
              wicketsTaken: stats.wicketsTaken,
              oversBowled: stats.oversBowled,
              runsConceded: stats.runsConceded,
              catches: stats.catches,
              stumpings: stats.stumpings,
              runOuts: stats.runOuts
            },
            create: {
              playerId: stats.playerId,
              matchId,
              teamId: stats.teamId,
              runsScored: stats.runsScored,
              ballsFaced: stats.ballsFaced,
              fours: stats.fours,
              sixes: stats.sixes,
              wicketsTaken: stats.wicketsTaken,
              oversBowled: stats.oversBowled,
              runsConceded: stats.runsConceded,
              catches: stats.catches,
              stumpings: stats.stumpings,
              runOuts: stats.runOuts
            }
          });
        }
      });

      // Create audit log
      await auditService.logAction({
        matchId,
        action: AuditAction.STATS_CALCULATED,
        performedBy: 'SYSTEM',
        newState: {
          playersAffected: playerStatsMap.size,
          ballsProcessed: balls.length
        }
      });

      logger.info(`Stats calculated for match ${matchId}: ${playerStatsMap.size} players`);
    } catch (error) {
      logger.error(`Failed to calculate stats for match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Helper: Get or create player stats in map
   */
  private static getOrCreatePlayerStats(
    map: Map<string, any>,
    playerId: string,
    teamId: string
  ) {
    if (!map.has(playerId)) {
      map.set(playerId, {
        playerId,
        teamId,
        runsScored: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        wicketsTaken: 0,
        oversBowled: 0,
        runsConceded: 0,
        catches: 0,
        stumpings: 0,
        runOuts: 0,
        isOut: false
      });
    }
    return map.get(playerId)!;
  }
}
