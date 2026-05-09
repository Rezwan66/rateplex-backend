import { Router } from 'express';
import { WatchlistController } from './watchlist.controller.js';
import { verifyToken } from '../../middleware/auth.middleware.js';

const router = Router();

// All routes are protected
router.use(verifyToken);

router.get('/', WatchlistController.getWatchlist);
router.post('/', WatchlistController.addToWatchlist);
router.patch('/:id', WatchlistController.updateWatchlistStatus);
router.delete('/:id', WatchlistController.removeFromWatchlist);

export const WatchlistRoutes = router;
