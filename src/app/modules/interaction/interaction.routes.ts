import { Router } from 'express';
import { InteractionController } from './interaction.controller.js';
import { verifyToken } from '../../middleware/auth.middleware.js';

const router = Router();

// All routes are protected
router.use(verifyToken);

router.post('/likes/:reviewId', InteractionController.toggleLike);
router.post('/comments', InteractionController.addComment);
router.delete('/comments/:id', InteractionController.deleteComment);

export const InteractionRoutes = router;
