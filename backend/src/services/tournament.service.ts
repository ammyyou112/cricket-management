import { prisma } from '@/config/database';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '@/utils/errors';
import { Tournament, TournamentStatus } from '@prisma/client';

export interface CreateTournamentInput {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface UpdateTournamentInput {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: TournamentStatus;
}

export interface GetTournamentsQuery {
  status?: TournamentStatus;
  page?: number;
  limit?: number;
}

export class TournamentService {
  /**
   * Create a new tournament
   */
  static async createTournament(
    userId: string,
    input: CreateTournamentInput
  ): Promise<Tournament> {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (endDate <= startDate) {
      throw new BadRequestError('End date must be after start date');
    }

    // Check if tournament name already exists
    const existingTournament = await prisma.tournament.findFirst({
      where: { tournamentName: input.name },
    });

    if (existingTournament) {
      throw new ConflictError('Tournament with this name already exists');
    }

    const tournament = await prisma.tournament.create({
      data: {
        tournamentName: input.name,
        description: input.description,
        startDate,
        endDate,
        status: TournamentStatus.UPCOMING,
        createdBy: userId,
      },
    });

    return tournament;
  }

  /**
   * Get all tournaments with pagination and filters
   */
  static async getTournaments(query: GetTournamentsQuery): Promise<{
    tournaments: Tournament[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    const total = await prisma.tournament.count({ where });

    const tournaments = await prisma.tournament.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { matches: true },
        },
      },
    });

    return {
      tournaments,
      total,
      page,
      limit,
    };
  }

  /**
   * Get tournament by ID
   */
  static async getTournamentById(tournamentId: string): Promise<any> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        matches: {
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
            scores: true,
          },
          orderBy: { matchDate: 'asc' },
        },
        _count: {
          select: { matches: true },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }

    // Transform tournamentName to name for API response
    const transformed = {
      ...tournament,
      name: tournament.tournamentName,
    };

    return transformed;
  }

  /**
   * Update tournament
   */
  static async updateTournament(
    tournamentId: string,
    input: UpdateTournamentInput
  ): Promise<Tournament> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }

    // Validate dates if provided
    if (input.startDate || input.endDate) {
      const startDate = input.startDate
        ? new Date(input.startDate)
        : tournament.startDate;
      const endDate = input.endDate
        ? new Date(input.endDate)
        : tournament.endDate;

      if (endDate <= startDate) {
        throw new BadRequestError('End date must be after start date');
      }
    }

    // Check name conflict if updating name
    if (input.name && input.name !== tournament.tournamentName) {
      const existingTournament = await prisma.tournament.findFirst({
        where: { tournamentName: input.name },
      });

      if (existingTournament) {
        throw new ConflictError('Tournament with this name already exists');
      }
    }

    const updateData: any = {};
    if (input.name) updateData.tournamentName = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.startDate) updateData.startDate = new Date(input.startDate);
    if (input.endDate) updateData.endDate = new Date(input.endDate);
    if (input.status) updateData.status = input.status;

    const updatedTournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: updateData,
    });

    return updatedTournament;
  }

  /**
   * Delete tournament
   */
  static async deleteTournament(tournamentId: string): Promise<void> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }

    await prisma.tournament.delete({
      where: { id: tournamentId },
    });
  }
}

