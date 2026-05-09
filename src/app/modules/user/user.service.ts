import status from 'http-status';
import bcrypt from 'bcrypt';
import { prisma } from '../../config/prisma.js';
import AppError from '../../utils/AppError.js';
import { Role } from '../../../generated/prisma/client.js';

const userSelectFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  bio: true,
  googleId: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ─── Get all users (Admin) ─────────────────────────────────────
const getAllUsers = async (query: {
  role?: string;
  search?: string;
  page: number;
  limit: number;
}) => {
  const where: Record<string, unknown> = {};
  if (query.role) where.role = query.role;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelectFields,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

// ─── Get user by ID ─────────────────────────────────────────────
const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelectFields,
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found.');
  }

  return user;
};

// ─── Update own profile ─────────────────────────────────────────
const updateProfile = async (
  userId: string,
  input: { name?: string; bio?: string; avatar?: string },
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.avatar !== undefined && { avatar: input.avatar || null }),
    },
    select: userSelectFields,
  });

  return user;
};

// ─── Change password ────────────────────────────────────────────
const changePassword = async (
  userId: string,
  input: { currentPassword: string; newPassword: string },
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found.');
  }

  if (!user.password) {
    throw new AppError(
      status.BAD_REQUEST,
      'Cannot change password for Google OAuth accounts.',
    );
  }

  const isMatch = await bcrypt.compare(input.currentPassword, user.password);
  if (!isMatch) {
    throw new AppError(status.UNAUTHORIZED, 'Current password is incorrect.');
  }

  const hashedPassword = await bcrypt.hash(input.newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

// ─── Delete user (Admin) ────────────────────────────────────────
const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found.');
  }

  await prisma.user.delete({ where: { id } });
};

// ─── Update user role (Admin) ───────────────────────────────────
const updateUserRole = async (id: string, role: Role) => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found.');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: userSelectFields,
  });

  return updated;
};

// ─── Get user stats ─────────────────────────────────────────────
const getUserStats = async (userId: string) => {
  const [reviewCount, watchlistCounts, likeCount] = await Promise.all([
    prisma.review.count({ where: { userId } }),
    prisma.watchlist.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
    }),
    prisma.like.count({ where: { userId } }),
  ]);

  const watchlistMap: Record<string, number> = {};
  for (const item of watchlistCounts) {
    watchlistMap[item.status] = item._count.id;
  }

  return {
    totalReviews: reviewCount,
    totalLikes: likeCount,
    watchlist: {
      watching: watchlistMap['WATCHING'] || 0,
      completed: watchlistMap['COMPLETED'] || 0,
      planToWatch: watchlistMap['PLAN_TO_WATCH'] || 0,
      onHold: watchlistMap['ON_HOLD'] || 0,
      dropped: watchlistMap['DROPPED'] || 0,
      total: Object.values(watchlistMap).reduce((a, b) => a + b, 0),
    },
  };
};

export const UserService = {
  getAllUsers,
  getUserById,
  updateProfile,
  changePassword,
  deleteUser,
  updateUserRole,
  getUserStats,
};
