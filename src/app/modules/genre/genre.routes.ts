import { Router } from 'express';
import { GenreController } from './genre.controller.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Public
router.get('/', GenreController.getAllGenres);

// Admin only
router.post('/', verifyToken, requireRole('ADMIN'), GenreController.createGenre);
router.delete('/:id', verifyToken, requireRole('ADMIN'), GenreController.deleteGenre);

export const GenreRoutes = router;
