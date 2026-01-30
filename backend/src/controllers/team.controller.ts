import { Request, Response, NextFunction } from 'express';
import { TeamService } from '@/services/team.service';
import { ResponseUtil } from '@/utils/response';
import logger from '@/utils/logger';
import { TeamMemberStatus } from '@prisma/client';

export class TeamController {
  /**
   * Create new team
   * POST /api/v1/teams
   */
  static async createTeam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;

      const team = await TeamService.createTeam({
        ...req.body,
        captainId: userId,
      });

      logger.info(`Team created: ${team.name} by ${userId}`);

      ResponseUtil.created(res, team, 'Team created successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get all teams
   * GET /api/v1/teams
   */
  static async getTeams(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await TeamService.getTeams(req.query);

      ResponseUtil.paginated(
        res,
        result.teams,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
        },
        'Teams retrieved successfully'
      );
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get team by ID
   * GET /api/v1/teams/:id
   */
  static async getTeamById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const team = await TeamService.getTeamById(req.params.id);

      ResponseUtil.success(res, team, 'Team retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Update team
   * PATCH /api/v1/teams/:id
   */
  static async updateTeam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      const team = await TeamService.updateTeam(
        req.params.id,
        userId,
        userRole,
        req.body
      );

      logger.info(`Team updated: ${team.name} by ${userId}`);

      ResponseUtil.success(res, team, 'Team updated successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Delete team
   * DELETE /api/v1/teams/:id
   */
  static async deleteTeam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      logger.info(`Attempting to delete team: ${req.params.id} by ${userId} (${userRole})`);

      await TeamService.deleteTeam(req.params.id, userId, userRole);

      logger.info(`Team deleted successfully: ${req.params.id} by ${userId}`);

      ResponseUtil.success(res, null, 'Team deleted successfully');
      return;
    } catch (error: any) {
      logger.error(`Failed to delete team ${req.params.id}:`, {
        error: error.message,
        stack: error.stack,
        code: error.code,
      });
      next(error);
      return;
    }
  }

  /**
   * Add member to team
   * POST /api/v1/teams/:id/members
   */
  static async addMember(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      const member = await TeamService.addMember(
        req.params.id,
        req.body.userId,
        userId,
        userRole
      );

      logger.info(`Member added to team ${req.params.id}: ${req.body.userId}`);

      ResponseUtil.created(res, member, 'Member added successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Remove member from team
   * DELETE /api/v1/teams/:id/members/:userId
   */
  static async removeMember(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const requestingUserId = (req as any).userId;
      const requestingUserRole = (req as any).userRole;

      await TeamService.removeMember(
        req.params.id,
        req.params.userId,
        requestingUserId,
        requestingUserRole
      );

      logger.info(`Member removed from team ${req.params.id}: ${req.params.userId}`);

      ResponseUtil.success(res, null, 'Member removed successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get user's teams
   * GET /api/v1/teams/my-teams
   */
  static async getMyTeams(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;

      const teams = await TeamService.getUserTeams(userId);

      ResponseUtil.success(res, teams, 'User teams retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Invite member to team (replaces addMember)
   * POST /api/v1/teams/:id/invite
   */
  static async inviteMember(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      const member = await TeamService.inviteMember(
        req.params.id,
        req.body.userId,
        userId,
        userRole
      );

      logger.info(`Member invited to team ${req.params.id}: ${req.body.userId}`);

      ResponseUtil.created(res, member, 'Member invited successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Update member status
   * PATCH /api/v1/teams/:id/members/:userId
   */
  static async updateMemberStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const requestingUserId = (req as any).userId;
      const requestingUserRole = (req as any).userRole;

      // Convert string status to enum
      const statusEnum = req.body.status as TeamMemberStatus;
      console.log(`🔄 [updateMemberStatus Controller] Updating status:`, {
        teamId: req.params.id,
        playerId: req.params.userId,
        status: req.body.status,
        statusEnum: statusEnum,
      });

      const member = await TeamService.updateMemberStatus(
        req.params.id,
        req.params.userId,
        statusEnum,
        requestingUserId,
        requestingUserRole
      );

      logger.info(
        `Member status updated: ${req.params.userId} → ${req.body.status}`
      );

      ResponseUtil.success(res, member, 'Member status updated successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Leave team
   * POST /api/v1/teams/:id/leave
   */
  static async leaveTeam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;

      await TeamService.leaveTeam(req.params.id, userId);

      logger.info(`User left team ${req.params.id}: ${userId}`);

      ResponseUtil.success(res, null, 'Left team successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Transfer captain role
   * PATCH /api/v1/teams/:id/captain
   */
  static async transferCaptain(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      const team = await TeamService.transferCaptain(
        req.params.id,
        req.body.newCaptainId,
        userId,
        userRole
      );

      logger.info(
        `Captain transferred for team ${req.params.id}: ${userId} → ${req.body.newCaptainId}`
      );

      ResponseUtil.success(res, team, 'Captain transferred successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Request to join a team (player-initiated)
   * POST /api/v1/teams/:id/request
   */
  static async requestToJoin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const playerId = (req as any).userId;

      const member = await TeamService.requestToJoin(
        req.params.id,
        playerId
      );

      logger.info(`Join request created for team ${req.params.id} by player ${playerId}`);

      ResponseUtil.created(res, member, 'Join request sent successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get pending join requests for a team (captain/admin only)
   * GET /api/v1/teams/:id/requests
   */
  static async getPendingRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      const requests = await TeamService.getPendingRequests(
        req.params.id,
        userId,
        userRole
      );

      logger.info(`Fetched ${requests.length} pending requests for team ${req.params.id}`);

      ResponseUtil.success(res, requests, 'Pending requests fetched successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get team members (ACTIVE members only)
   * GET /api/v1/teams/:id/members
   */
  static async getTeamMembers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const members = await TeamService.getTeamMembers(req.params.id);

      logger.info(`Fetched ${members.length} active members for team ${req.params.id}`);

      ResponseUtil.success(res, members, 'Team members fetched successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get player invitations (INVITED status for logged-in player)
   * GET /api/v1/teams/invitations/my
   */
  static async getMyInvitations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const invitations = await TeamService.getPlayerInvitations(userId);

      logger.info(`Fetched ${invitations.length} invitations for player ${userId}`);

      ResponseUtil.success(res, invitations, 'Invitations fetched successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get player's pending join requests (PENDING status for logged-in player)
   * GET /api/v1/teams/requests/my
   */
  static async getMyPendingRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const pendingRequests = await TeamService.getPlayerPendingRequests(userId);

      logger.info(`Fetched ${pendingRequests.length} pending requests for player ${userId}`);

      ResponseUtil.success(res, pendingRequests, 'Pending requests fetched successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}

