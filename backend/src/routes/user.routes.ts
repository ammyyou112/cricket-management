import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { StatsController } from '@/controllers/stats.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import {
  updateProfileSchema,
  changePasswordSchema,
  updateUserRoleSchema,
  getUserByIdSchema,
  searchUsersSchema,
} from '@/validators/user.validator';
import { UserRole } from '@prisma/client';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get all users (paginated with filters)
router.get(
  '/',
  validate(searchUsersSchema),
  UserController.getUsers
);

// Search users
router.get('/search', UserController.searchUsers);

// Change own password
router.put(
  '/password',
  validate(changePasswordSchema),
  UserController.changePassword
);

// Update own location
router.patch('/location', UserController.updateLocation);

// Player statistics routes (must be before /:id route)
router.get('/:playerId/stats/summary', StatsController.getPlayerStatsSummary);
router.get('/:playerId/stats', StatsController.getPlayerStats);

// Get user by ID
router.get(
  '/:id',
  validate(getUserByIdSchema),
  UserController.getUserById
);

// Update user profile (own or admin)
router.patch(
  '/:id',
  validate(updateProfileSchema),
  UserController.updateProfile
);

// Admin only routes
router.patch(
  '/:id/role',
  authorize(UserRole.ADMIN),
  validate(updateUserRoleSchema),
  UserController.updateUserRole
);

router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(getUserByIdSchema),
  UserController.deleteUser
);

// Block/Unblock user (admin only)
router.patch(
  '/:id/block',
  authorize(UserRole.ADMIN),
  validate(getUserByIdSchema),
  UserController.blockUser
);

router.patch(
  '/:id/unblock',
  authorize(UserRole.ADMIN),
  validate(getUserByIdSchema),
  UserController.unblockUser
);

// Suspend/Unsuspend user (admin only)
router.patch(
  '/:id/suspend',
  authorize(UserRole.ADMIN),
  validate(getUserByIdSchema),
  UserController.suspendUser
);

router.patch(
  '/:id/unsuspend',
  authorize(UserRole.ADMIN),
  validate(getUserByIdSchema),
  UserController.unsuspendUser
);

export default router;

