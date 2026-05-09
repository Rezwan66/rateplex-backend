import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { Response } from 'express';
import { envVars } from '../config/env.js';

// ─── Payload type ───────────────────────────────────────────────
export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

// ─── Sign tokens ────────────────────────────────────────────────
export const signAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, envVars.JWT_ACCESS_SECRET, {
    expiresIn: envVars.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
};

export const signRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, envVars.JWT_REFRESH_SECRET, {
    expiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
};

// ─── Verify tokens ──────────────────────────────────────────────
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, envVars.JWT_ACCESS_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, envVars.JWT_REFRESH_SECRET) as JwtPayload;
};

// ─── Cookie helpers ─────────────────────────────────────────────
const REFRESH_TOKEN_COOKIE = 'rateplex_refresh_token';

export const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: envVars.NODE_ENV === 'production',
    sameSite: envVars.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: envVars.NODE_ENV === 'production',
    sameSite: envVars.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
};

export const getRefreshTokenFromCookie = (cookies: Record<string, string>): string | undefined => {
  return cookies[REFRESH_TOKEN_COOKIE] as string | undefined;
};
