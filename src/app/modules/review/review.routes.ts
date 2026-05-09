import { Router } from 'express';
import { ReviewController } from './review.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createReviewSchema, updateReviewSchema, reviewStatusSchema } from './review.validation.js';

const router = Router();

// Protected routes
router.get('/my', verifyToken, ReviewController.getMyReviews);
router.post('/', verifyToken, validateRequest(createReviewSchema), ReviewController.createReview);
router.patch('/:id', verifyToken, validateRequest(updateReviewSchema), ReviewController.updateReview);
router.delete('/:id', verifyToken, ReviewController.deleteReview);

// Admin routes
router.get('/', verifyToken, requireRole('ADMIN'), ReviewController.getAllReviews);
router.patch('/:id/status', verifyToken, requireRole('ADMIN'), validateRequest(reviewStatusSchema), ReviewController.updateReviewStatus);

export const ReviewRoutes = router;
