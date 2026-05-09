import { Router } from 'express';
import { UserController } from './user.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { updateProfileSchema, changePasswordSchema, updateRoleSchema } from './user.validation.js';

const router = Router();

// Protected routes
router.patch('/profile', verifyToken, validateRequest(updateProfileSchema), UserController.updateProfile);
router.patch('/change-password', verifyToken, validateRequest(changePasswordSchema), UserController.changePassword);

// Protected — get user by ID and stats
router.get('/:id', verifyToken, UserController.getUserById);
router.get('/:id/stats', verifyToken, UserController.getUserStats);

// Admin routes
router.get('/', verifyToken, requireRole('ADMIN'), UserController.getAllUsers);
router.delete('/:id', verifyToken, requireRole('ADMIN'), UserController.deleteUser);
router.patch('/:id/role', verifyToken, requireRole('ADMIN'), validateRequest(updateRoleSchema), UserController.updateUserRole);

export const UserRoutes = router;
