import { prisma } from '@/config/database';
import { NotFoundError } from '@/utils/errors';

export class SettingsService {
  /**
   * Get captain settings (create default if not exists)
   */
  static async getSettings(userId: string) {
    let settings = await prisma.captainSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.captainSettings.create({
        data: {
          userId,
          autoApproveEnabled: true,
          timeoutMinutes: 5,
          notifyOnAutoApprove: true
        }
      });
    }

    return settings;
  }

  /**
   * Update captain settings
   */
  static async updateSettings(
    userId: string,
    data: {
      autoApproveEnabled?: boolean;
      timeoutMinutes?: number;
      notifyOnAutoApprove?: boolean;
    }
  ) {
    // Validate timeout minutes
    if (data.timeoutMinutes !== undefined) {
      if (data.timeoutMinutes < 1 || data.timeoutMinutes > 60) {
        throw new Error('Timeout minutes must be between 1 and 60');
      }
    }

    // Upsert settings
    const settings = await prisma.captainSettings.upsert({
      where: { userId },
      update: {
        ...(data.autoApproveEnabled !== undefined && { autoApproveEnabled: data.autoApproveEnabled }),
        ...(data.timeoutMinutes !== undefined && { timeoutMinutes: data.timeoutMinutes }),
        ...(data.notifyOnAutoApprove !== undefined && { notifyOnAutoApprove: data.notifyOnAutoApprove })
      },
      create: {
        userId,
        autoApproveEnabled: data.autoApproveEnabled ?? true,
        timeoutMinutes: data.timeoutMinutes ?? 5,
        notifyOnAutoApprove: data.notifyOnAutoApprove ?? true
      }
    });

    return settings;
  }
}

export const settingsService = SettingsService;

