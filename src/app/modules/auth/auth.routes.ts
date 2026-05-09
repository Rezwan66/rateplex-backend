import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { registerSchema, loginSchema, googleAuthSchema } from './auth.validation.js';
import { verifyToken } from '../../middleware/auth.middleware.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Public routes (with auth rate limiting)
router.post('/register', authLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/google', authLimiter, validateRequest(googleAuthSchema), AuthController.googleAuth);
router.post('/refresh', AuthController.refresh);

// Protected routes
router.post('/logout', verifyToken, AuthController.logout);
router.get('/me', verifyToken, AuthController.getMe);

export const AuthRoutes = router;
