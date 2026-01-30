import { Router } from 'express';
import { AuditController } from '@/controllers/audit.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get match audit logs
router.get('/match/:matchId', AuditController.getMatchAuditLogs);

// Get score history
router.get('/match/:matchId/score-history', AuditController.getScoreHistory);

// Get audit logs by action (admin only)
router.get('/action/:action', AuditController.getAuditLogsByAction);

export default router;

