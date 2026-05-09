import { prisma } from '../../config/prisma.js';

// ─── Admin stats ────────────────────────────────────────────────
const getAdminStats = async () => {
  const [userCount, mediaCount, reviewCount, subscriptionCount] = await Promise.all([
    prisma.user.count(),
    prisma.media.count(),
    prisma.review.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
  ]);

  return {
    userCount,
    mediaCount,
    reviewCount,
    subscriptionCount,
  };
};

// ─── Admin recent activity ──────────────────────────────────────
const getRecentActivity = async () => {
  const [recentUsers, recentReviews, recentSubscriptions] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.review.findMany({
      include: {
        user: { select: { id: true, name: true } },
        media: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.subscription.findMany({
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return { recentUsers, recentReviews, recentSubscriptions };
};

// ─── Charts: Media by type ──────────────────────────────────────
const getMediaByType = async () => {
  const data = await prisma.media.groupBy({
    by: ['type'],
    _count: { id: true },
  });

  return data.map((item) => ({
    type: item.type,
    count: item._count.id,
  }));
};

// ─── Charts: Reviews over time (last 30 days) ──────────────────
const getReviewsOverTime = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const reviews = await prisma.review.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const grouped: Record<string, number> = {};
  for (const review of reviews) {
    const date = review.createdAt.toISOString().split('T')[0];
    grouped[date] = (grouped[date] || 0) + 1;
  }

  // Fill in missing dates
  const result: Array<{ date: string; count: number }> = [];
  const current = new Date(thirtyDaysAgo);
  const today = new Date();

  while (current <= today) {
    const dateStr = current.toISOString().split('T')[0];
    result.push({ date: dateStr, count: grouped[dateStr] || 0 });
    current.setDate(current.getDate() + 1);
  }

  return result;
};

// ─── Charts: Top rated media ────────────────────────────────────
const getTopRated = async () => {
  const media = await prisma.media.findMany({
    where: { reviewCount: { gt: 0 } },
    select: {
      id: true,
      title: true,
      type: true,
      averageRating: true,
      reviewCount: true,
      posterUrl: true,
    },
    orderBy: { averageRating: 'desc' },
    take: 10,
  });

  return media;
};

// ─── User personal stats ───────────────────────────────────────
const getUserStats = async (userId: string) => {
  const [
    totalWatched,
    watchingNow,
    planToWatch,
    reviewsWritten,
    recentWatchlist,
    recentReviews,
  ] = await Promise.all([
    prisma.watchlist.count({ where: { userId, status: 'COMPLETED' } }),
    prisma.watchlist.count({ where: { userId, status: 'WATCHING' } }),
    prisma.watchlist.count({ where: { userId, status: 'PLAN_TO_WATCH' } }),
    prisma.review.count({ where: { userId } }),
    prisma.watchlist.findMany({
      where: { userId },
      include: {
        media: {
          select: { id: true, title: true, posterUrl: true, type: true, averageRating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.review.findMany({
      where: { userId },
      include: {
        media: {
          select: { id: true, title: true, posterUrl: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ]);

  return {
    totalWatched,
    watchingNow,
    planToWatch,
    reviewsWritten,
    recentWatchlist,
    recentReviews,
  };
};

export const DashboardService = {
  getAdminStats,
  getRecentActivity,
  getMediaByType,
  getReviewsOverTime,
  getTopRated,
  getUserStats,
};
