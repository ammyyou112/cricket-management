/**
 * Cricket 360 - Upload Service
 */

import { prisma } from '@/config/database';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '@/utils/errors';
import { UserRole } from '@prisma/client';
import {
  STORAGE_BUCKETS,
  uploadFile,
  deleteFile,
  getPublicUrl,
} from '@/config/storage';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export class UploadService {
  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(
    userId: string,
    file: Express.Multer.File
  ): Promise<{ url: string }> {
    // Validate file
    if (!file) {
      throw new BadRequestError('No file provided');
    }

    // Get user to check if they have an existing profile picture
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePictureUrl: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${userId}/${uuidv4()}${fileExtension}`;
    const filePath = `profile-pictures/${fileName}`;

    // Delete old profile picture if exists
    if (user.profilePictureUrl) {
      try {
        // Extract path from URL
        const oldPath = this.extractPathFromUrl(
          user.profilePictureUrl,
          STORAGE_BUCKETS.PROFILE_PICTURES
        );
        if (oldPath) {
          await deleteFile(STORAGE_BUCKETS.PROFILE_PICTURES, oldPath);
        }
      } catch (error) {
        // Log error but don't fail the upload
        console.error('Failed to delete old profile picture:', error);
      }
    }

    // Upload to Supabase Storage
    await uploadFile(
      STORAGE_BUCKETS.PROFILE_PICTURES,
      filePath,
      file.buffer,
      file.mimetype
    );

    // Get public URL
    const publicUrl = getPublicUrl(STORAGE_BUCKETS.PROFILE_PICTURES, filePath);

    // Update user profile picture URL
    await prisma.user.update({
      where: { id: userId },
      data: { profilePictureUrl: publicUrl },
    });

    return { url: publicUrl };
  }

  /**
   * Delete profile picture
   */
  static async deleteProfilePicture(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePictureUrl: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.profilePictureUrl) {
      throw new BadRequestError('No profile picture to delete');
    }

    // Extract path from URL
    const filePath = this.extractPathFromUrl(
      user.profilePictureUrl,
      STORAGE_BUCKETS.PROFILE_PICTURES
    );

    if (filePath) {
      // Delete from storage
      await deleteFile(STORAGE_BUCKETS.PROFILE_PICTURES, filePath);
    }

    // Update user to remove profile picture URL
    await prisma.user.update({
      where: { id: userId },
      data: { profilePictureUrl: null },
    });
  }

  /**
   * Upload team logo
   */
  static async uploadTeamLogo(
    teamId: string,
    userId: string,
    userRole: string,
    file: Express.Multer.File
  ): Promise<{ url: string }> {
    // Validate file
    if (!file) {
      throw new BadRequestError('No file provided');
    }

    // Get team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { logoUrl: true, captainId: true },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Check authorization (only captain or admin)
    const isCaptain = team.captainId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isCaptain && !isAdmin) {
      throw new ForbiddenError('Only team captain or admin can upload team logo');
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${teamId}/${uuidv4()}${fileExtension}`;
    const filePath = `team-logos/${fileName}`;

    // Delete old logo if exists
    if (team.logoUrl) {
      try {
        const oldPath = this.extractPathFromUrl(
          team.logoUrl,
          STORAGE_BUCKETS.TEAM_LOGOS
        );
        if (oldPath) {
          await deleteFile(STORAGE_BUCKETS.TEAM_LOGOS, oldPath);
        }
      } catch (error) {
        console.error('Failed to delete old team logo:', error);
      }
    }

    // Upload to Supabase Storage
    await uploadFile(
      STORAGE_BUCKETS.TEAM_LOGOS,
      filePath,
      file.buffer,
      file.mimetype
    );

    // Get public URL
    const publicUrl = getPublicUrl(STORAGE_BUCKETS.TEAM_LOGOS, filePath);

    // Update team logo URL
    await prisma.team.update({
      where: { id: teamId },
      data: { logoUrl: publicUrl },
    });

    return { url: publicUrl };
  }

  /**
   * Delete team logo
   */
  static async deleteTeamLogo(
    teamId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { logoUrl: true, captainId: true },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Check authorization
    const isCaptain = team.captainId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isCaptain && !isAdmin) {
      throw new ForbiddenError('Only team captain or admin can delete team logo');
    }

    if (!team.logoUrl) {
      throw new BadRequestError('No team logo to delete');
    }

    // Extract path from URL
    const filePath = this.extractPathFromUrl(
      team.logoUrl,
      STORAGE_BUCKETS.TEAM_LOGOS
    );

    if (filePath) {
      // Delete from storage
      await deleteFile(STORAGE_BUCKETS.TEAM_LOGOS, filePath);
    }

    // Update team to remove logo URL
    await prisma.team.update({
      where: { id: teamId },
      data: { logoUrl: null },
    });
  }

  /**
   * Extract file path from Supabase public URL
   */
  private static extractPathFromUrl(
    url: string,
    bucket: string
  ): string | null {
    try {
      // Supabase public URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      const urlPattern = new RegExp(
        `/storage/v1/object/public/${bucket}/(.+)$`
      );
      const match = url.match(urlPattern);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Failed to extract path from URL:', error);
      return null;
    }
  }
}

