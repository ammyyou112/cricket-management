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

// New unified approval system endpoints
// Request approval (supports all 3 types)
router.post('/:matchId/request-new', ApprovalController.requestApproval);

// Respond to approval (unified)
router.post('/:approvalId/respond-new', ApprovalController.respondToApprovalNew);

// Get pending approvals (unified)
router.get('/pending-new', ApprovalController.getPendingApprovalsNew);

export default router;

