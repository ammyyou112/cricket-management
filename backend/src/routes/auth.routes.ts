import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate } from '@/middleware/auth.middleware';
import { authLimiter } from '@/middleware/rateLimit.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/validators/auth.validator';

const router = Router();

// Public routes (with rate limiting)
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  AuthController.register
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  AuthController.login
);

router.post(
  '/logout',
  validate(refreshTokenSchema),
  AuthController.logout
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  AuthController.refresh
);

// Password reset routes (public, with rate limiting)
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

// Protected routes
router.get('/me', authenticate, AuthController.getMe);

export default router;
