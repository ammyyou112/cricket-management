import { prisma } from '@/config/database';
import { NotificationType } from '@prisma/client';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export class NotificationService {
  /**
   * Create a notification
   */
  static async createNotification(input: CreateNotificationInput): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          link: input.link
        }
      });
    } catch (error) {
      // Don't throw - notification creation should not break main flow
      console.error('Failed to create notification:', error);
    }
  }

  /**
   * Create notifications for multiple users
   */
  static async createBulkNotifications(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    link?: string
  ): Promise<void> {
    try {
      await prisma.notification.createMany({
        data: userIds.map(userId => ({
          userId,
          type,
          title,
          message,
          link
        }))
      });
    } catch (error) {
      console.error('Failed to create bulk notifications:', error);
    }
  }
}

export const notificationService = NotificationService;

