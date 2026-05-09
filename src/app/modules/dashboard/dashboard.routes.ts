import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Admin dashboard routes
router.get('/admin/stats', verifyToken, requireRole('ADMIN'), DashboardController.getAdminStats);
router.get('/admin/recent-activity', verifyToken, requireRole('ADMIN'), DashboardController.getRecentActivity);
router.get('/admin/charts/media-by-type', verifyToken, requireRole('ADMIN'), DashboardController.getMediaByType);
router.get('/admin/charts/reviews-over-time', verifyToken, requireRole('ADMIN'), DashboardController.getReviewsOverTime);
router.get('/admin/charts/top-rated', verifyToken, requireRole('ADMIN'), DashboardController.getTopRated);

// User dashboard
router.get('/user/stats', verifyToken, DashboardController.getUserStats);

export const DashboardRoutes = router;
