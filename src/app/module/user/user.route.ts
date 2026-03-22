import { Router } from 'express';
import { UserController } from './user.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { createUserZodSchema } from './user.validation';

const router = Router();

router.post('/create-user', validateRequest(createUserZodSchema), UserController.createUser);

export const UserRoutes = router;
