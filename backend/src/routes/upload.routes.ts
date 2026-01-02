/**
 * Cricket 360 - Upload Routes
 */

import { Router } from 'express';
import { UploadController } from '@/controllers/upload.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { uploadSingle } from '@/middleware/upload.middleware';
import { uploadLimiter } from '@/middleware/rateLimit.middleware';
import { z } from 'zod';

const router = Router();

// Validation schema for team ID param
const teamIdSchema = z.object({
  params: z.object({
    teamId: z.string().uuid('Invalid team ID format'),
  }),
});

// All upload routes require authentication
router.use(authenticate);

// Apply rate limiting to all upload routes
router.use(uploadLimiter);

// Upload profile picture
router.post(
  '/profile',
  uploadSingle('file'),
  UploadController.uploadProfilePicture
);

// Delete profile picture
router.delete('/profile', UploadController.deleteProfilePicture);

// Upload team logo
router.post(
  '/team/:teamId',
  (req, res, next) => {
    try {
      teamIdSchema.parse({ params: req.params });
      next();
      return;
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
      return;
    }
  },
  uploadSingle('file'),
  UploadController.uploadTeamLogo
);

// Delete team logo
router.delete(
  '/team/:teamId',
  (req, res, next) => {
    try {
      teamIdSchema.parse({ params: req.params });
      next();
      return;
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
      return;
    }
  },
  UploadController.deleteTeamLogo
);

export default router;
