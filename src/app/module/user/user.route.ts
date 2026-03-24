import { Router } from 'express';
import { UserController } from './user.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { createUserZodSchema, loginUserZodSchema } from './user.validation';

const router = Router();

// Register user
router.post('/create-user', validateRequest(createUserZodSchema), UserController.createUser);

// Login user
router.post('/login-user', validateRequest(loginUserZodSchema), UserController.loginUser);

export const UserRoutes = router;
