import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/auth.service';
import { ResponseUtil } from '@/utils/response';
import { UnauthorizedError } from '@/utils/errors';
import logger from '@/utils/logger';

export class AuthController {
  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);

      logger.info(`User registered: ${result.user.email}`);

      ResponseUtil.created(res, result, 'User registered successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);

      logger.info(`User logged in: ${result.user.email}`);

      ResponseUtil.success(res, result, 'Login successful');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      await AuthService.logout(refreshToken);

      logger.info(`User logged out`);

      ResponseUtil.success(res, null, 'Logout successful');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const tokens = await AuthService.refreshAccessToken(refreshToken);

      ResponseUtil.success(res, tokens, 'Token refreshed successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId as string | undefined;
      
      if (!userId) {
        throw new UnauthorizedError('User ID not found in request');
      }

      const user = await AuthService.getUserById(userId);
      ResponseUtil.success(res, user, 'User profile retrieved');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await AuthService.requestPasswordReset(email);
      logger.info(`Password reset requested for email: ${email}`);
      ResponseUtil.success(res, result, result.message);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Reset password with token
   * POST /api/v1/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      await AuthService.resetPassword(token, newPassword);
      logger.info('Password reset successful');
      ResponseUtil.success(res, null, 'Password has been reset successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}
