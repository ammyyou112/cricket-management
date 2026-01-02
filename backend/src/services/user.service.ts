import { prisma } from '@/config/database';
import { PasswordUtil } from '@/utils/password';
import {
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors';
import { User, UserRole } from '@prisma/client';

export interface UpdateProfileInput {
  fullName?: string;
  playerType?: 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKET_KEEPER';
  phone?: string;
  city?: string;
  profilePictureUrl?: string;
  locationLatitude?: number;
  locationLongitude?: number;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface GetUsersQuery {
  search?: string;
  role?: UserRole;
  playerType?: 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKET_KEEPER';
  page?: number;
  limit?: number;
}

export class UserService {
  /**
   * Get user by ID (without password)
   */
  static async getUserById(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get all users with pagination and filters
   */
  static async getUsers(query: GetUsersQuery): Promise<{
    users: Omit<User, 'password'>[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.playerType) {
      where.playerType = query.playerType;
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Remove passwords
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    return {
      users: usersWithoutPasswords,
      total,
      page,
      limit,
    };
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: input,
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isPasswordValid = await PasswordUtil.compare(
      input.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await PasswordUtil.hash(input.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(
    userId: string,
    role: UserRole
  ): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Block user (admin only)
   */
  static async blockUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Unblock user (admin only)
   */
  static async unblockUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Suspend user (admin only)
   */
  static async suspendUser(userId: string, reason?: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspendReason: reason || null,
        suspendedAt: new Date(),
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Unsuspend user (admin only)
   */
  static async unsuspendUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: false,
        suspendReason: null,
        suspendedAt: null,
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(
    searchTerm: string,
    limit: number = 10
  ): Promise<Omit<User, 'password'>[]> {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { fullName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: Math.min(limit, 50), // Max 50 results
      orderBy: { fullName: 'asc' },
    });

    return users.map(({ password, ...user }) => user);
  }
}

