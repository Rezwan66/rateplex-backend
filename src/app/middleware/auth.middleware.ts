import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import AppError from '../utils/AppError.js';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.utils.js';
import { Role } from '../../generated/prisma/client.js';

// ─── Extend Express Request ────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// ─── Verify JWT Token ──────────────────────────────────────────
export const verifyToken = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(status.UNAUTHORIZED, 'Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      userId: decoded.userId as string,
      role: decoded.role as string,
      email: decoded.email as string,
    };
    next();
  } catch {
    throw new AppError(status.UNAUTHORIZED, 'Invalid or expired access token.');
  }
};

// ─── Role-based guard ──────────────────────────────────────────
export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(status.UNAUTHORIZED, 'Authentication required.');
    }

    if (!roles.includes(req.user.role as Role)) {
      throw new AppError(
        status.FORBIDDEN,
        'You do not have permission to perform this action.',
      );
    }

    next();
  };
};
