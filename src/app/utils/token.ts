import { JwtPayload, SignOptions } from 'jsonwebtoken';
import { jwtUtils } from './jwt';
import { envVars } from '../config/env';
import { Response } from 'express';
import { cookieUtils } from './cookie';

const getAccessToken = (payload: JwtPayload): string => {
  const accessToken = jwtUtils.createToken(payload, envVars.JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: envVars.JWT_ACCESS_TOKEN_EXPIRY,
  } as SignOptions);
  return accessToken;
};

const setAccessToken = (res: Response, accessToken: string) => {
  cookieUtils.setCookie(res, 'accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

export const tokenUtils = { getAccessToken, setAccessToken };
