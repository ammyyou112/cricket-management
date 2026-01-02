import { Router } from 'express';
import { TeamController } from '@/controllers/team.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import {
  createTeamSchema,
  updateTeamSchema,
  getTeamByIdSchema,
  addMemberSchema,
  removeMemberSchema,
  getTeamsSchema,
  updateMemberStatusSchema,
  transferCaptainSchema,
} from '@/validators/team.validator';
import { UserRole } from '@prisma/client';

const router = Router();

// All team routes require authentication
router.use(authenticate);

// Get user's teams (before /:id to avoid route conflict)
router.get('/my-teams', TeamController.getMyTeams);

// Get player invitations (before /:id to avoid route conflict)
router.get('/invitations/my', TeamController.getMyInvitations);

// Get all teams (with filters)
router.get('/', validate(getTeamsSchema), TeamController.getTeams);

// Create team (captain or admin only)
router.post(
  '/',
  authorize(UserRole.CAPTAIN, UserRole.ADMIN),
  validate(createTeamSchema),
  TeamController.createTeam
);

// IMPORTANT: More specific routes must come BEFORE general /:id routes
// Get team members (ACTIVE members only) - must be before /:id
router.get(
  '/:id/members',
  validate(getTeamByIdSchema),
  TeamController.getTeamMembers
);

// Get pending join requests (captain/admin only) - must be before /:id
router.get(
  '/:id/requests',
  validate(getTeamByIdSchema),
  TeamController.getPendingRequests
);

// Request to join team (player-initiated) - must be before /:id
router.post(
  '/:id/request',
  validate(getTeamByIdSchema),
  TeamController.requestToJoin
);

// Get team by ID
router.get(
  '/:id',
  validate(getTeamByIdSchema),
  TeamController.getTeamById
);

// Update team (captain or admin)
router.patch(
  '/:id',
  validate(updateTeamSchema),
  TeamController.updateTeam
);

// Delete team (captain or admin)
router.delete(
  '/:id',
  validate(getTeamByIdSchema),
  TeamController.deleteTeam
);

// Add member to team
router.post(
  '/:id/members',
  validate(addMemberSchema),
  TeamController.addMember
);

// Remove member from team
router.delete(
  '/:id/members/:userId',
  validate(removeMemberSchema),
  TeamController.removeMember
);

// Invite member (new invitation system)
router.post(
  '/:id/invite',
  validate(addMemberSchema),
  TeamController.inviteMember
);

// Update member status (accept/reject)
router.patch(
  '/:id/members/:userId',
  validate(updateMemberStatusSchema),
  TeamController.updateMemberStatus
);

// Leave team
router.post(
  '/:id/leave',
  validate(getTeamByIdSchema),
  TeamController.leaveTeam
);

// Transfer captain
router.patch(
  '/:id/captain',
  validate(transferCaptainSchema),
  TeamController.transferCaptain
);

export default router;

