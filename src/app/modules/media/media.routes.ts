import { Router } from 'express';
import { MediaController } from './media.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createMediaSchema, updateMediaSchema } from './media.validation.js';

const router = Router();

// Public routes (specific paths BEFORE :id param routes)
router.get('/featured', MediaController.getFeaturedMedia);
router.get('/stats', verifyToken, requireRole('ADMIN'), MediaController.getMediaStats);
router.get('/', MediaController.getAllMedia);
router.get('/:id', MediaController.getMediaById);
router.get('/:id/reviews', MediaController.getMediaReviews);

// Admin routes
router.post('/', verifyToken, requireRole('ADMIN'), validateRequest(createMediaSchema), MediaController.createMedia);
router.patch('/:id', verifyToken, requireRole('ADMIN'), validateRequest(updateMediaSchema), MediaController.updateMedia);
router.delete('/:id', verifyToken, requireRole('ADMIN'), MediaController.deleteMedia);

export const MediaRoutes = router;
