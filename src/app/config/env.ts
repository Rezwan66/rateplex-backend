import dotenv from 'dotenv';
import { AppError } from '../errorHandling';
import status from 'http-status';

dotenv.config();

interface EnvConfig {
  // NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
  FRONTEND_URL: string;
  JWT_ACCESS_TOKEN_SECRET: string;
  JWT_ACCESS_TOKEN_EXPIRY: string;
}

const loadEnvVariables = (): EnvConfig => {
  const requireEnvVariable = [
    // 'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'FRONTEND_URL',
    'JWT_ACCESS_TOKEN_SECRET',
    'JWT_ACCESS_TOKEN_EXPIRY',
  ];

  requireEnvVariable.forEach(variable => {
    if (!process.env[variable]) {
      // throw new Error(`Environment variable ${variable} is required but not set in .env file.`);
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        `Environment variable ${variable} is required but not set in .env file.`,
      );
    }
  });

  return {
    // NODE_ENV: process.env.NODE_ENV as string,
    PORT: process.env.PORT as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET as string,
    JWT_ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_TOKEN_EXPIRY as string,
  };
};

export const envVars = loadEnvVariables();
