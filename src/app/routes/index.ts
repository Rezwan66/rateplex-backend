import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes.js';
import { UserRoutes } from '../modules/user/user.routes.js';
import { GenreRoutes } from '../modules/genre/genre.routes.js';
import { MediaRoutes } from '../modules/media/media.routes.js';
import { ReviewRoutes } from '../modules/review/review.routes.js';
import { WatchlistRoutes } from '../modules/watchlist/watchlist.routes.js';
import { InteractionRoutes } from '../modules/interaction/interaction.routes.js';
import { DashboardRoutes } from '../modules/dashboard/dashboard.routes.js';
import { AIRoutes } from '../modules/ai/ai.routes.js';

const router = Router();

router.use('/auth', AuthRoutes);
router.use('/users', UserRoutes);
router.use('/genres', GenreRoutes);
router.use('/media', MediaRoutes);
router.use('/reviews', ReviewRoutes);
router.use('/watchlist', WatchlistRoutes);
router.use('/interactions', InteractionRoutes);
router.use('/dashboard', DashboardRoutes);
router.use('/ai', AIRoutes);

export const IndexRoutes = router;
