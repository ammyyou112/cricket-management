import { prisma } from '@/config/database';
import { PasswordUtil } from '@/utils/password';
import { JwtUtil } from '@/utils/jwt';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '@/utils/errors';
import { User, UserRole } from '@prisma/client';
import * as crypto from 'crypto';

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role?: 'PLAYER' | 'CAPTAIN' | 'ADMIN';
  playerType?: 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKET_KEEPER';
  phone?: string;
  city?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(input: RegisterInput): Promise<AuthResponse> {
    // ═══ VALIDATION ═══
    
    // 1. Required fields
    if (!input.email || !input.password || !input.fullName || !input.role) {
      throw new BadRequestError('All fields are required');
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailLower = input.email.toLowerCase().trim();
    
    if (!emailRegex.test(emailLower)) {
      throw new BadRequestError('Please enter a valid email address');
    }

    // 3. Block test emails (NEW REGISTRATIONS ONLY)
    const testPatterns = [
      /test\d*@/i,
      /fake\d*@/i,
      /temp\d*@/i,
      /dummy\d*@/i,
      /sample\d*@/i,
      /@test\./i,
      /@example\./i,
      /@fake\./i,
      /@temp\./i
    ];

    if (testPatterns.some(pattern => pattern.test(emailLower))) {
      throw new BadRequestError(
        'Please use a real email address (Gmail, Outlook, Yahoo, etc.). Test emails are not allowed for new registrations.'
      );
    }

    // 4. Password strength
    if (input.password.length < 8) {
      throw new BadRequestError('Password must be at least 8 characters long');
    }

    const hasUpperCase = /[A-Z]/.test(input.password);
    const hasLowerCase = /[a-z]/.test(input.password);
    const hasNumber = /[0-9]/.test(input.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      throw new BadRequestError('Password must contain uppercase, lowercase, and number');
    }

    // 5. Full name validation
    if (input.fullName.trim().length < 2) {
      throw new BadRequestError('Please enter your full name');
    }

    // 6. Role validation
    const allowedRoles = ['PLAYER', 'CAPTAIN'];
    if (!allowedRoles.includes(input.role)) {
      throw new BadRequestError('Invalid role. Only PLAYER and CAPTAIN are allowed for registration.');
    }

    // 7. Player type required for PLAYER role
    if (input.role === 'PLAYER' && !input.playerType) {
      throw new BadRequestError('Player type is required for players');
    }

    // 8. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email already exists. Please login instead.');
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hash(input.password);

    // SECURITY: Prevent ADMIN role registration via public endpoint
    if (input.role === UserRole.ADMIN) {
      throw new ForbiddenError('Admin accounts cannot be created through registration. Please contact an existing administrator.');
    }

    // Determine role - use input role if provided, otherwise default to PLAYER
    // Only allow PLAYER and CAPTAIN roles through public registration
    const userRole = input.role || UserRole.PLAYER;
    
    // Ensure only valid roles (PLAYER or CAPTAIN) are allowed
    if (userRole !== UserRole.PLAYER && userRole !== UserRole.CAPTAIN) {
      throw new BadRequestError('Invalid role. Only PLAYER and CAPTAIN roles can be registered.');
    }
    
    // 9. Create user
    const user = await prisma.user.create({
      data: {
        email: emailLower,
        password: hashedPassword,
        fullName: input.fullName.trim(),
        playerType: input.playerType,
        phone: input.phone?.trim(),
        city: input.city?.trim(),
        role: userRole,
      },
    });

    // Generate tokens
    const tokens = JwtUtil.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Login user
   */
  static async login(input: LoginInput): Promise<AuthResponse> {
    // ═══ VALIDATION ═══
    
    // 1. Required fields
    if (!input.email || !input.password) {
      throw new BadRequestError('Email and password are required');
    }

    // 2. Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailLower = input.email.toLowerCase().trim();
    
    if (!emailRegex.test(emailLower)) {
      throw new BadRequestError('Please enter a valid email address');
    }

    // 3. Find user (allow test emails for existing users)
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 4. Check if account is blocked
    if (user.isBlocked) {
      throw new ForbiddenError('Your account has been blocked. Please contact support.');
    }

    // 5. Check if suspended
    if (user.isSuspended) {
      throw new ForbiddenError(
        `Your account is suspended. Reason: ${user.suspendReason || 'Policy violation'}`
      );
    }

    // 6. Verify password
    const isPasswordValid = await PasswordUtil.compare(
      input.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const tokens = JwtUtil.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Logout user (invalidate refresh token)
   */
  static async logout(refreshToken: string): Promise<void> {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord) {
      throw new NotFoundError('Refresh token not found');
    }

    // Delete refresh token from database
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Verify refresh token
    let payload;
    try {
      payload = JwtUtil.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Check if refresh token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord) {
      throw new UnauthorizedError('Refresh token not found or has been revoked');
    }

    // Check if token has expired
    if (tokenRecord.expiresAt < new Date()) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Generate new token pair
    const newTokens = JwtUtil.generateTokenPair({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    // Delete old refresh token and create new one
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    await prisma.refreshToken.create({
      data: {
        token: newTokens.refreshToken,
        userId: payload.userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return newTokens;
  }

  /**
   * Get user by ID
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
   * Request password reset - generates a reset token
   */
  static async requestPasswordReset(email: string): Promise<{ message: string; token?: string }> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not (security best practice)
    // Always return success message, but only generate token if user exists
    if (!user) {
      // Return success message even if user doesn't exist (prevents email enumeration)
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    });

    // In production, send email with reset link
    // For now, return token in response (for development/testing)
    // TODO: Implement email service to send reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/forgot-password?token=${resetToken}`;
    
    // Log the reset link in development (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Password reset link for ${email}: ${resetLink}`);
    }

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Include token in development mode only
      ...(process.env.NODE_ENV === 'development' && { token: resetToken }),
    };
  }

  /**
   * Reset password using reset token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    // Check if token is already used
    if (resetToken.used) {
      throw new BadRequestError('This reset token has already been used');
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      throw new UnauthorizedError('Reset token has expired. Please request a new one.');
    }

    // Hash new password
    const hashedPassword = await PasswordUtil.hash(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Delete all refresh tokens for this user (force re-login)
    await prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId },
    });
  }
}
