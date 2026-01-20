import { Router } from 'express';
import { ApprovalController } from '@/controllers/approval.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

// All approval routes require authentication
router.use(authenticate);

// Request match start
router.post('/:matchId/request', ApprovalController.requestMatchStart);

// Respond to approval
router.post('/:approvalId/respond', ApprovalController.respondToApproval);

// Get pending approvals
router.get('/pending', ApprovalController.getPendingApprovals);

export default router;

