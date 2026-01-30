import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '@/utils/response';
import { BadRequestError } from '@/utils/errors';
import { settingsService } from '@/services/settings.service';
import logger from '@/utils/logger';
import { AuditAction } from '@prisma/client';
import { auditService } from '@/services/audit.service';

export class SettingsController {
  /**
   * Get captain settings
   * GET /api/v1/settings
   */
  static async getSettings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;

      const settings = await settingsService.getSettings(userId);

      ResponseUtil.success(res, settings, 'Settings retrieved successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Update captain settings
   * PATCH /api/v1/settings
   */
  static async updateSettings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { autoApproveEnabled, timeoutMinutes, notifyOnAutoApprove } = req.body;

      // Validate input
      if (autoApproveEnabled !== undefined && typeof autoApproveEnabled !== 'boolean') {
        throw new BadRequestError('autoApproveEnabled must be a boolean');
      }

      if (timeoutMinutes !== undefined) {
        if (typeof timeoutMinutes !== 'number' || timeoutMinutes < 1 || timeoutMinutes > 60) {
          throw new BadRequestError('timeoutMinutes must be a number between 1 and 60');
        }
      }

      if (notifyOnAutoApprove !== undefined && typeof notifyOnAutoApprove !== 'boolean') {
        throw new BadRequestError('notifyOnAutoApprove must be a boolean');
      }

      const previousSettings = await settingsService.getSettings(userId);

      const settings = await settingsService.updateSettings(userId, {
        autoApproveEnabled,
        timeoutMinutes,
        notifyOnAutoApprove
      });

      // Create audit log
      if (autoApproveEnabled !== undefined) {
        await auditService.logAction({
          action: autoApproveEnabled ? AuditAction.TIMEOUT_ENABLED : AuditAction.TIMEOUT_DISABLED,
          performedBy: userId,
          previousState: { autoApproveEnabled: previousSettings.autoApproveEnabled },
          newState: { autoApproveEnabled: settings.autoApproveEnabled }
        });
      }

      logger.info(`Settings updated for user ${userId}`);

      ResponseUtil.success(res, settings, 'Settings updated successfully');
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}

