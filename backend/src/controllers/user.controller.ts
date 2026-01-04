import { Request, Response, NextFunction } from 'express';
import { UserService } from '@/services/user.service';
import { ResponseUtil } from '@/utils/response';
import logger from '@/utils/logger';
import { ForbiddenError, BadRequestError } from '@/utils/errors';

export class UserController {
  /**
   * Get all users (with pagination and filters)
   * GET /api/v1/users
   */
  static async getUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await UserService.getUsers(req.query);

      ResponseUtil.paginated(
        res,
        result.users,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
        },
        'Users retrieved successfully'
      );
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get user by ID
   * GET /api/v1/users/:id
   */
  static async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await UserService.getUserById(req.params.id);

      ResponseUtil.success(res, user, 'User retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Update user profile
   * PATCH /api/v1/users/:id
   */
  static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const targetUserId = req.params.id;
      const userRole = (req as any).userRole;

      // Users can only update their own profile unless they're admin
      if (userId !== targetUserId && userRole !== 'ADMIN') {
        throw new ForbiddenError(
          'You can only update your own profile'
        );
      }

      const user = await UserService.updateProfile(targetUserId, req.body);

      logger.info(`User profile updated: ${user.email}`);

      ResponseUtil.success(res, user, 'Profile updated successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Change password
   * PUT /api/v1/users/password
   */
  static async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;

      await UserService.changePassword(userId, req.body);

      logger.info(`Password changed for user: ${userId}`);

      ResponseUtil.success(res, null, 'Password changed successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Update user role (admin only)
   * PATCH /api/v1/users/:id/role
   */
  static async updateUserRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await UserService.updateUserRole(
        req.params.id,
        req.body.role
      );

      logger.info(`User role updated: ${user.email} → ${user.role}`);

      ResponseUtil.success(res, user, 'User role updated successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Delete user (admin only)
   * DELETE /api/v1/users/:id
   */
  static async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const targetUserId = req.params.id;

      // Prevent self-deletion
      if (userId === targetUserId) {
        throw new ForbiddenError('You cannot delete your own account');
      }

      await UserService.deleteUser(targetUserId);

      logger.info(`User deleted: ${targetUserId}`);

      ResponseUtil.success(res, null, 'User deleted successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Search users
   * GET /api/v1/users/search
   */
  static async searchUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { q, limit } = req.query;
      const searchTerm = q as string;
      const searchLimit = limit ? parseInt(limit as string, 10) : 10;

      if (!searchTerm) {
        ResponseUtil.success(res, [], 'No search term provided');
        return;
      }

      const users = await UserService.searchUsers(searchTerm, searchLimit);

      ResponseUtil.success(
        res,
        users,
        `Found ${users.length} user(s)`
      );
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Block user (admin only)
   * PATCH /api/v1/users/:id/block
   */
  static async blockUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const targetUserId = req.params.id;
      const userId = (req as any).userId;

      // Prevent self-blocking
      if (userId === targetUserId) {
        throw new ForbiddenError('You cannot block your own account');
      }

      const user = await UserService.blockUser(targetUserId);

      logger.info(`User blocked: ${targetUserId}`);

      ResponseUtil.success(res, user, 'User blocked successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Unblock user (admin only)
   * PATCH /api/v1/users/:id/unblock
   */
  static async unblockUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const targetUserId = req.params.id;

      const user = await UserService.unblockUser(targetUserId);

      logger.info(`User unblocked: ${targetUserId}`);

      ResponseUtil.success(res, user, 'User unblocked successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Suspend user (admin only)
   * PATCH /api/v1/users/:id/suspend
   */
  static async suspendUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const targetUserId = req.params.id;
      const userId = (req as any).userId;
      const { reason } = req.body;

      // Prevent self-suspension
      if (userId === targetUserId) {
        throw new ForbiddenError('You cannot suspend your own account');
      }

      const user = await UserService.suspendUser(targetUserId, reason);

      logger.info(`User suspended: ${targetUserId}, reason: ${reason || 'No reason provided'}`);

      ResponseUtil.success(res, user, 'User suspended successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Unsuspend user (admin only)
   * PATCH /api/v1/users/:id/unsuspend
   */
  static async unsuspendUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const targetUserId = req.params.id;

      const user = await UserService.unsuspendUser(targetUserId);

      logger.info(`User unsuspended: ${targetUserId}`);

      ResponseUtil.success(res, user, 'User unsuspended successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Update user location
   * PATCH /api/v1/users/location
   */
  static async updateLocation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { locationLatitude, locationLongitude } = req.body;

      // Validate that coordinates are provided
      if (locationLatitude === undefined || locationLongitude === undefined) {
        throw new BadRequestError('Location coordinates are required');
      }

      // Validate coordinates are numbers
      if (typeof locationLatitude !== 'number' || typeof locationLongitude !== 'number') {
        throw new BadRequestError('Coordinates must be numbers');
      }

      // Validate coordinate ranges
      if (locationLatitude < -90 || locationLatitude > 90) {
        throw new BadRequestError('Latitude must be between -90 and 90');
      }

      if (locationLongitude < -180 || locationLongitude > 180) {
        throw new BadRequestError('Longitude must be between -180 and 180');
      }

      const user = await UserService.updateLocation(
        userId,
        locationLatitude,
        locationLongitude
      );

      logger.info(`User location updated: ${user.email}`);

      ResponseUtil.success(res, user, 'Location updated successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}

