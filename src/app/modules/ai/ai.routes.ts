import { Router } from 'express';
import { AIController } from './ai.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// All AI routes are protected + rate limited
router.use(verifyToken);
router.use(authLimiter);

router.post('/recommendations', AIController.getRecommendations);
router.post('/chat', AIController.chat);
router.post('/analyze-taste', AIController.analyzeTaste);
router.post('/review-sentiment', AIController.reviewSentiment);

// Admin only
router.post('/auto-tag', requireRole('ADMIN'), AIController.autoTag);

export const AIRoutes = router;
