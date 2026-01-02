import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '@/config/constants';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export class JwtUtil {
  /**
   * Generate access token
   */
  static generateAccessToken(payload: JwtPayload): string {
    const secret = JWT_CONFIG.SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign(payload, secret, {
      expiresIn: JWT_CONFIG.EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: JwtPayload): string {
    const secret = JWT_CONFIG.REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }
    return jwt.sign(payload, secret, {
      expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JwtPayload {
    const secret = JWT_CONFIG.SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    return jwt.verify(token, secret) as JwtPayload;
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JwtPayload {
    const secret = JWT_CONFIG.REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }
    return jwt.verify(token, secret) as JwtPayload;
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokenPair(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }
}
