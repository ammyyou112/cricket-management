import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '@/utils/jwt';
import { UnauthorizedError, ForbiddenError } from '@/utils/errors';
import { prisma } from '@/config/database';
import { UserRole } from '@prisma/client';
import { retryDbOperation } from '@/utils/dbRetry';

/**
 * Authenticate user from JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = JwtUtil.verifyAccessToken(token);

    // Get user from database with retry logic
    const user = await retryDbOperation(
      () => prisma.user.findUnique({
        where: { id: payload.userId },
      })
    );

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Attach user to request
    (req as any).user = user;
    (req as any).userId = user.id;
    (req as any).userRole = user.role;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize based on user roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const userRole = (req as any).userRole;
    
    if (!user || !userRole) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(userRole as UserRole)) {
      return next(
        new ForbiddenError('You do not have permission to access this resource')
      );
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = JwtUtil.verifyAccessToken(token);

      const user = await retryDbOperation(
        () => prisma.user.findUnique({
          where: { id: payload.userId },
        })
      );

      if (user) {
        (req as any).user = user;
        (req as any).userId = user.id;
        (req as any).userRole = user.role;
      }
    }

    next();
  } catch (error) {
    // Don't fail - just continue without user
    next();
  }
};
