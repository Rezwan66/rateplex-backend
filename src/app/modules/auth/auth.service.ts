/* eslint-disable @typescript-eslint/no-unused-vars */
import status from 'http-status';
import bcrypt from 'bcrypt';
import { prisma } from '../../config/prisma.js';
import AppError from '../../utils/AppError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../../utils/jwt.utils.js';

// ─── Helpers ────────────────────────────────────────────────────
const buildTokenPayload = (user: { id: string; role: string; email: string }): TokenPayload => ({
  userId: user.id,
  role: user.role,
  email: user.email,
});

const generateTokens = (payload: TokenPayload) => ({
  accessToken: signAccessToken(payload),
  refreshToken: signRefreshToken(payload),
});

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

// ─── Register ───────────────────────────────────────────────────
const register = async (payload: { name: string; email: string; password: string }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new AppError(status.CONFLICT, 'A user with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
    },
    select: userSelectFields,
  });

  const tokenPayload = buildTokenPayload(user);
  const tokens = generateTokens(tokenPayload);

  return { user, ...tokens };
};

// ─── Login ──────────────────────────────────────────────────────
const login = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid email or password.');
  }

  if (!user.password) {
    throw new AppError(
      status.UNAUTHORIZED,
      'This account uses Google sign-in. Please log in with Google.',
    );
  }

  const isMatch = await bcrypt.compare(payload.password, user.password);

  if (!isMatch) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid email or password.');
  }

  const tokenPayload = buildTokenPayload(user);
  const tokens = generateTokens(tokenPayload);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, ...tokens };
};

// ─── Google Auth ────────────────────────────────────────────────
const googleAuth = async (payload: {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}) => {
  // Try to find user by googleId first, then by email
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ googleId: payload.googleId }, { email: payload.email }],
    },
  });

  if (user) {
    // Update googleId if user exists by email but doesn't have googleId
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.googleId,
          avatar: user.avatar || payload.avatar,
        },
      });
    }
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        googleId: payload.googleId,
        avatar: payload.avatar,
      },
    });
  }

  const tokenPayload = buildTokenPayload(user);
  const tokens = generateTokens(tokenPayload);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, ...tokens };
};

// ─── Refresh Token ──────────────────────────────────────────────
const refreshToken = async (token: string) => {
  let decoded: TokenPayload;

  try {
    const verified = verifyRefreshToken(token);
    decoded = {
      userId: verified.userId as string,
      role: verified.role as string,
      email: verified.email as string,
    };
  } catch {
    throw new AppError(status.UNAUTHORIZED, 'Invalid or expired refresh token.');
  }

  // Verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: userSelectFields,
  });

  if (!user) {
    throw new AppError(status.UNAUTHORIZED, 'User no longer exists.');
  }

  // Issue new access token
  const newTokenPayload = buildTokenPayload(user);
  const accessToken = signAccessToken(newTokenPayload);

  return { accessToken, user };
};

// ─── Get Me ─────────────────────────────────────────────────────
const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelectFields,
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, 'User not found.');
  }

  return user;
};

export const AuthService = {
  register,
  login,
  googleAuth,
  refreshToken,
  getMe,
};
