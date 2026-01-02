import { Request, Response, NextFunction } from 'express';
import { TournamentService } from '@/services/tournament.service';
import { ResponseUtil } from '@/utils/response';
import logger from '@/utils/logger';

export class TournamentController {
  /**
   * Create new tournament
   * POST /api/v1/tournaments
   */
  static async createTournament(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;

      const tournament = await TournamentService.createTournament(userId, req.body);

      logger.info(`Tournament created: ${tournament.tournamentName} by ${userId}`);

      ResponseUtil.created(res, tournament, 'Tournament created successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get all tournaments
   * GET /api/v1/tournaments
   */
  static async getTournaments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await TournamentService.getTournaments(req.query);

      ResponseUtil.paginated(
        res,
        result.tournaments,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
        },
        'Tournaments retrieved successfully'
      );
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get tournament by ID
   * GET /api/v1/tournaments/:id
   */
  static async getTournamentById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tournament = await TournamentService.getTournamentById(req.params.id);

      ResponseUtil.success(res, tournament, 'Tournament retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Update tournament
   * PATCH /api/v1/tournaments/:id
   */
  static async updateTournament(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tournament = await TournamentService.updateTournament(
        req.params.id,
        req.body
      );

      logger.info(`Tournament updated: ${tournament.tournamentName}`);

      ResponseUtil.success(res, tournament, 'Tournament updated successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Delete tournament
   * DELETE /api/v1/tournaments/:id
   */
  static async deleteTournament(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await TournamentService.deleteTournament(req.params.id);

      logger.info(`Tournament deleted: ${req.params.id}`);

      ResponseUtil.success(res, null, 'Tournament deleted successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}

