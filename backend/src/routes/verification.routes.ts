import { Router } from 'express';
import { VerificationController } from '@/controllers/verification.controller';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// All verification routes require authentication
router.use(authenticate);

// Submit score for verification
router.post('/:matchId/submit', VerificationController.submitScoreForVerification);

// Verify score
router.post('/:verificationId/verify', VerificationController.verifyScore);

// Get pending verifications
router.get('/pending', VerificationController.getPendingVerifications);

// Admin-only routes
router.get('/disputed', authorize(UserRole.ADMIN), VerificationController.getDisputedVerifications);
router.post('/:verificationId/resolve', authorize(UserRole.ADMIN), VerificationController.resolveDispute);

export default router;

