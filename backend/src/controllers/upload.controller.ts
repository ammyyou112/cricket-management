/**
 * Cricket 360 - Upload Controller
 */

import { Request, Response, NextFunction } from 'express';
import { UploadService } from '@/services/upload.service';
import { ResponseUtil } from '@/utils/response';
import logger from '@/utils/logger';

export class UploadController {
  /**
   * Upload profile picture
   * POST /api/v1/upload/profile
   */
  static async uploadProfilePicture(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const file = req.file;

      if (!file) {
        ResponseUtil.error(
          res,
          'No file uploaded',
          400,
          'Please provide a file to upload'
        );
        return;
      }

      const result = await UploadService.uploadProfilePicture(userId, file);

      logger.info(`Profile picture uploaded for user: ${userId}`);

      ResponseUtil.success(
        res,
        result,
        'Profile picture uploaded successfully'
      );
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Delete profile picture
   * DELETE /api/v1/upload/profile
   */
  static async deleteProfilePicture(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;

      await UploadService.deleteProfilePicture(userId);

      logger.info(`Profile picture deleted for user: ${userId}`);

      ResponseUtil.success(res, null, 'Profile picture deleted successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Upload team logo
   * POST /api/v1/upload/team/:teamId
   */
  static async uploadTeamLogo(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const teamId = req.params.teamId;
      const file = req.file;

      if (!file) {
        ResponseUtil.error(
          res,
          'No file uploaded',
          400,
          'Please provide a file to upload'
        );
        return;
      }

      const result = await UploadService.uploadTeamLogo(
        teamId,
        userId,
        userRole,
        file
      );

      logger.info(`Team logo uploaded for team: ${teamId} by user: ${userId}`);

      ResponseUtil.success(res, result, 'Team logo uploaded successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Delete team logo
   * DELETE /api/v1/upload/team/:teamId
   */
  static async deleteTeamLogo(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const teamId = req.params.teamId;

      await UploadService.deleteTeamLogo(teamId, userId, userRole);

      logger.info(`Team logo deleted for team: ${teamId} by user: ${userId}`);

      ResponseUtil.success(res, null, 'Team logo deleted successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}
