import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AuthService } from './auth.service.js';
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
} from '../../utils/jwt.utils.js';
import AppError from '../../utils/AppError.js';

// ─── Register ───────────────────────────────────────────────────
const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);

  setRefreshTokenCookie(res, result.refreshToken);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: 'Registration successful.',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

// ─── Login ──────────────────────────────────────────────────────
const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);

  setRefreshTokenCookie(res, result.refreshToken);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Login successful.',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

// ─── Google Auth ────────────────────────────────────────────────
const googleAuth = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.googleAuth(req.body);

  setRefreshTokenCookie(res, result.refreshToken);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Google authentication successful.',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

// ─── Refresh Token ──────────────────────────────────────────────
const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = getRefreshTokenFromCookie(req.cookies as Record<string, string>);

  if (!token) {
    throw new AppError(status.UNAUTHORIZED, 'No refresh token provided.');
  }

  const result = await AuthService.refreshToken(token);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Token refreshed successfully.',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

// ─── Logout ─────────────────────────────────────────────────────
const logout = catchAsync(async (_req: Request, res: Response) => {
  clearRefreshTokenCookie(res);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Logged out successfully.',
  });
});

// ─── Get Me ─────────────────────────────────────────────────────
const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await AuthService.getMe(userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'User profile retrieved successfully.',
    data: user,
  });
});

export const AuthController = {
  register,
  login,
  googleAuth,
  refresh,
  logout,
  getMe,
};
