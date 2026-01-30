import { Router } from 'express';
import { SettingsController } from '@/controllers/settings.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get settings
router.get('/', SettingsController.getSettings);

// Update settings
router.patch('/', SettingsController.updateSettings);

export default router;

