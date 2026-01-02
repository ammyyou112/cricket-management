import { prisma } from '@/config/database';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '@/utils/errors';
import { Match, MatchStatus, UserRole, MatchType, TeamMemberStatus } from '@prisma/client';
import {
  emitMatchScoreUpdate,
  emitMatchStatusUpdate,
  emitPlayerStatUpdate,
  emitMatchCreated,
} from '@/sockets/socket';

export interface CreateMatchInput {
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  venue: string;
  matchDate: string;
  matchType: 'LEAGUE' | 'KNOCKOUT' | 'FRIENDLY';
}

export interface UpdateMatchInput {
  venue?: string;
  matchDate?: string;
  matchType?: 'LEAGUE' | 'KNOCKOUT' | 'FRIENDLY';
  status?: MatchStatus;
}

export interface UpdateMatchScoreInput {
  teamAScore?: {
    runs: number;
    wickets: number;
    overs: number;
    extrasWide?: number;
    extrasNoball?: number;
    extrasBye?: number;
    extrasLegbye?: number;
    inningsNumber?: number;
  };
  teamBScore?: {
    runs: number;
    wickets: number;
    overs: number;
    extrasWide?: number;
    extrasNoball?: number;
    extrasBye?: number;
    extrasLegbye?: number;
    inningsNumber?: number;
  };
}

export interface AddPlayerStatInput {
  playerId: string;
  runs?: number;
  ballsFaced?: number;
  fours?: number;
  sixes?: number;
  wickets?: number;
  oversBowled?: number;
  runsConceded?: number;
  catches?: number;
  runOuts?: number;
  stumpings?: number;
}

export interface GetMatchesQuery {
  tournamentId?: string;
  teamId?: string;
  status?: MatchStatus;
  page?: number;
  limit?: number;
}

export class MatchService {
  /**
   * Create a new match
   */
  static async createMatch(input: CreateMatchInput): Promise<Match> {
    // Validate tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: input.tournamentId },
    });

    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }

    // Validate teams exist
    const [teamA, teamB] = await Promise.all([
      prisma.team.findUnique({ where: { id: input.teamAId } }),
      prisma.team.findUnique({ where: { id: input.teamBId } }),
    ]);

    if (!teamA) {
      throw new NotFoundError('Team A not found');
    }

    if (!teamB) {
      throw new NotFoundError('Team B not found');
    }

    if (input.teamAId === input.teamBId) {
      throw new BadRequestError('Teams cannot play against themselves');
    }

    const match = await prisma.match.create({
      data: {
        tournamentId: input.tournamentId,
        teamAId: input.teamAId,
        teamBId: input.teamBId,
        venue: input.venue,
        matchDate: new Date(input.matchDate),
        matchType: input.matchType as MatchType,
        status: MatchStatus.SCHEDULED,
      },
      include: {
        teamA: {
          select: {
            id: true,
            teamName: true,
            logoUrl: true,
          },
        },
        teamB: {
          select: {
            id: true,
            teamName: true,
            logoUrl: true,
          },
        },
        tournament: {
          select: {
            id: true,
            tournamentName: true,
          },
        },
      },
    });

    // Emit Socket.io event for new match
    emitMatchCreated(input.tournamentId, match);

    return match;
  }

  /**
   * Get all matches with pagination and filters
   */
  static async getMatches(query: GetMatchesQuery): Promise<{
    matches: Match[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.tournamentId) {
      where.tournamentId = query.tournamentId;
    }

    if (query.teamId) {
      where.OR = [
        { teamAId: query.teamId },
        { teamBId: query.teamId },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    const total = await prisma.match.count({ where });

    const matches = await prisma.match.findMany({
      where,
      skip,
      take: limit,
      orderBy: { matchDate: 'desc' },
      include: {
        teamA: {
          select: {
            id: true,
            teamName: true,
            logoUrl: true,
          },
        },
        teamB: {
          select: {
            id: true,
            teamName: true,
            logoUrl: true,
          },
        },
        tournament: {
          select: {
            id: true,
            tournamentName: true,
          },
        },
        // Only include scores if they exist (optional relation)
        scores: {
          select: {
            id: true,
            matchId: true,
            battingTeamId: true,
            totalRuns: true,
            totalWickets: true,
            totalOvers: true,
          },
        },
      },
    });

    return {
      matches,
      total,
      page,
      limit,
    };
  }

  /**
   * Get match by ID
   */
  static async getMatchById(matchId: string): Promise<any> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: {
          select: {
            id: true,
            teamName: true,
            logoUrl: true,
            captain: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        teamB: {
          select: {
            id: true,
            teamName: true,
            logoUrl: true,
            captain: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        tournament: true,
        scores: {
          select: {
            id: true,
            matchId: true,
            battingTeamId: true,
            totalRuns: true,
            totalWickets: true,
            totalOvers: true,
            extrasWide: true,
            extrasNoball: true,
            extrasBye: true,
            extrasLegbye: true,
            inningsNumber: true,
            isCompleted: true,
          },
        },
        playerStats: {
          include: {
            player: {
              select: {
                id: true,
                fullName: true,
                playerType: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundError('Match not found');
    }

    return match;
  }

  /**
   * Update match details
   */
  static async updateMatch(
    matchId: string,
    userId: string,
    userRole: string,
    input: UpdateMatchInput
  ): Promise<Match> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: true,
        teamB: true,
      },
    });

    if (!match) {
      throw new NotFoundError('Match not found');
    }

    // Only admin or team captains can update match
    const isCaptain =
      match.teamA.captainId === userId || match.teamB.captainId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isCaptain && !isAdmin) {
      throw new ForbiddenError('Only captains or admin can update match details');
    }

    const updateData: any = {};
    if (input.venue) updateData.venue = input.venue;
    if (input.matchDate) updateData.matchDate = new Date(input.matchDate);
    if (input.matchType) updateData.matchType = input.matchType as MatchType;
    if (input.status) updateData.status = input.status;

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
      include: {
        teamA: {
          select: {
            id: true,
            teamName: true,
            logoUrl: true,
          },
        },
        teamB: {
          select: {
            id: true,
            teamName: true,
            logoUrl: true,
          },
        },
        tournament: true,
        scores: {
          select: {
            id: true,
            matchId: true,
            battingTeamId: true,
            totalRuns: true,
            totalWickets: true,
            totalOvers: true,
            extrasWide: true,
            extrasNoball: true,
            extrasBye: true,
            extrasLegbye: true,
            inningsNumber: true,
            isCompleted: true,
          },
        },
      },
    });

    // Emit Socket.io event for status change
    if (input.status) {
      emitMatchStatusUpdate(matchId, input.status);
    }

    return updatedMatch;
  }

  /**
   * Update match score
   */
  static async updateMatchScore(
    matchId: string,
    userId: string,
    userRole: string,
    input: UpdateMatchScoreInput
  ): Promise<any> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: true,
        teamB: true,
      },
    });

    if (!match) {
      throw new NotFoundError('Match not found');
    }

    // Only admin or team captains can update scores
    const isCaptain =
      match.teamA.captainId === userId || match.teamB.captainId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isCaptain && !isAdmin) {
      throw new ForbiddenError('Only captains or admin can update match scores');
    }

    // Update or create score for Team A
    if (input.teamAScore) {
      const inningsNumber = input.teamAScore.inningsNumber || 1;
      const existingScore = await prisma.matchScore.findUnique({
        where: {
          matchId_battingTeamId_inningsNumber: {
            matchId,
            battingTeamId: match.teamAId,
            inningsNumber,
          },
        },
      });

      if (existingScore) {
        await prisma.matchScore.update({
          where: { id: existingScore.id },
          data: {
            totalRuns: input.teamAScore.runs,
            totalWickets: input.teamAScore.wickets,
            totalOvers: input.teamAScore.overs,
            extrasWide: input.teamAScore.extrasWide,
            extrasNoball: input.teamAScore.extrasNoball,
            extrasBye: input.teamAScore.extrasBye,
            extrasLegbye: input.teamAScore.extrasLegbye,
          },
        });
      } else {
        await prisma.matchScore.create({
          data: {
            matchId,
            battingTeamId: match.teamAId,
            totalRuns: input.teamAScore.runs,
            totalWickets: input.teamAScore.wickets,
            totalOvers: input.teamAScore.overs,
            extrasWide: input.teamAScore.extrasWide || 0,
            extrasNoball: input.teamAScore.extrasNoball || 0,
            extrasBye: input.teamAScore.extrasBye || 0,
            extrasLegbye: input.teamAScore.extrasLegbye || 0,
            inningsNumber,
          },
        });
      }
    }

    // Update or create score for Team B
    if (input.teamBScore) {
      const inningsNumber = input.teamBScore.inningsNumber || 1;
      const existingScore = await prisma.matchScore.findUnique({
        where: {
          matchId_battingTeamId_inningsNumber: {
            matchId,
            battingTeamId: match.teamBId,
            inningsNumber,
          },
        },
      });

      if (existingScore) {
        await prisma.matchScore.update({
          where: { id: existingScore.id },
          data: {
            totalRuns: input.teamBScore.runs,
            totalWickets: input.teamBScore.wickets,
            totalOvers: input.teamBScore.overs,
            extrasWide: input.teamBScore.extrasWide,
            extrasNoball: input.teamBScore.extrasNoball,
            extrasBye: input.teamBScore.extrasBye,
            extrasLegbye: input.teamBScore.extrasLegbye,
          },
        });
      } else {
        await prisma.matchScore.create({
          data: {
            matchId,
            battingTeamId: match.teamBId,
            totalRuns: input.teamBScore.runs,
            totalWickets: input.teamBScore.wickets,
            totalOvers: input.teamBScore.overs,
            extrasWide: input.teamBScore.extrasWide || 0,
            extrasNoball: input.teamBScore.extrasNoball || 0,
            extrasBye: input.teamBScore.extrasBye || 0,
            extrasLegbye: input.teamBScore.extrasLegbye || 0,
            inningsNumber,
          },
        });
      }
    }

    // Fetch updated match with scores
    const updatedMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: {
          select: {
            id: true,
            teamName: true,
            logoUrl: true,
          },
        },
        teamB: {
          select: {
            id: true,
            teamName: true,
            logoUrl: true,
          },
        },
        tournament: true,
        scores: {
          select: {
            id: true,
            matchId: true,
            battingTeamId: true,
            totalRuns: true,
            totalWickets: true,
            totalOvers: true,
            extrasWide: true,
            extrasNoball: true,
            extrasBye: true,
            extrasLegbye: true,
            inningsNumber: true,
            isCompleted: true,
          },
        },
      },
    });

    // Emit Socket.io event for score update
    emitMatchScoreUpdate(matchId, updatedMatch);

    return updatedMatch!;
  }

  /**
   * Add or update player statistics
   */
  static async addPlayerStat(
    matchId: string,
    userId: string,
    userRole: string,
    input: AddPlayerStatInput
  ): Promise<any> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: true,
        teamB: true,
      },
    });

    if (!match) {
      throw new NotFoundError('Match not found');
    }

    // Only admin or team captains can add player stats
    const isCaptain =
      match.teamA.captainId === userId || match.teamB.captainId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isCaptain && !isAdmin) {
      throw new ForbiddenError('Only captains or admin can add player statistics');
    }

    // Verify player exists
    const player = await prisma.user.findUnique({
      where: { id: input.playerId },
    });

    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Determine which team the player belongs to in this match
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        playerId: input.playerId,
        teamId: {
          in: [match.teamAId, match.teamBId],
        },
        status: TeamMemberStatus.ACTIVE,
      },
    });

    if (!teamMember) {
      throw new BadRequestError('Player is not a member of either team in this match');
    }

    const playerTeamId = teamMember.teamId;

    // Verify team belongs to this match (safety check)
    if (playerTeamId !== match.teamAId && playerTeamId !== match.teamBId) {
      throw new BadRequestError('Player team does not belong to this match');
    }

    // Create or update player stat
    const playerStat = await prisma.playerStat.upsert({
      where: {
        playerId_matchId: {
          matchId,
          playerId: input.playerId,
        },
      },
      create: {
        matchId,
        playerId: input.playerId,
        teamId: playerTeamId,
        runsScored: input.runs || 0,
        ballsFaced: input.ballsFaced || 0,
        fours: input.fours || 0,
        sixes: input.sixes || 0,
        wicketsTaken: input.wickets || 0,
        oversBowled: input.oversBowled || 0,
        runsConceded: input.runsConceded || 0,
        catches: input.catches || 0,
        runOuts: input.runOuts || 0,
        stumpings: input.stumpings || 0,
      },
      update: {
        runsScored: input.runs,
        ballsFaced: input.ballsFaced,
        fours: input.fours,
        sixes: input.sixes,
        wicketsTaken: input.wickets,
        oversBowled: input.oversBowled,
        runsConceded: input.runsConceded,
        catches: input.catches,
        runOuts: input.runOuts,
        stumpings: input.stumpings,
      },
      include: {
        player: {
          select: {
            id: true,
            fullName: true,
            playerType: true,
          },
        },
      },
    });

    // Emit Socket.io event for player stat update
    emitPlayerStatUpdate(matchId, playerStat);

    return playerStat;
  }

  /**
   * Delete match
   */
  static async deleteMatch(
    matchId: string,
    userRole: string
  ): Promise<void> {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only admin can delete matches');
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundError('Match not found');
    }

    await prisma.match.delete({
      where: { id: matchId },
    });
  }
}

