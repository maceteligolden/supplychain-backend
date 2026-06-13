import 'dotenv/config';

import { z } from 'zod';

import {
  DEFAULT_SUPER_ADMIN_EMAIL,
  DEFAULT_SUPER_ADMIN_FIRST_NAME,
  DEFAULT_SUPER_ADMIN_LAST_NAME,
  DEFAULT_SUPER_ADMIN_PASSWORD,
} from './auth.constants';
import { DEFAULT_PORT, DEFAULT_API_VERSION } from './app.constants';

/**
 * Zod schema for environment variables.
 * Only this file may read `process.env` directly.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  API_VERSION: z.string().default(DEFAULT_API_VERSION),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .default(
      'postgresql://supplychain:supplychain@localhost:5432/supplychain?schema=public',
    ),
  JWT_SECRET: z.string().min(1).default('change-me-in-production'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1).default('change-me-refresh-in-production'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  SUPER_ADMIN_EMAIL: z.string().email().default(DEFAULT_SUPER_ADMIN_EMAIL),
  SUPER_ADMIN_PASSWORD: z.string().min(8).default(DEFAULT_SUPER_ADMIN_PASSWORD),
  SUPER_ADMIN_FIRST_NAME: z.string().min(1).default(DEFAULT_SUPER_ADMIN_FIRST_NAME),
  SUPER_ADMIN_LAST_NAME: z.string().min(1).default(DEFAULT_SUPER_ADMIN_LAST_NAME),
  UPLOAD_DIR: z.string().default('uploads'),
});

const parsedEnv = envSchema.parse(process.env);

/**
 * Validated environment configuration.
 * Import from `@/shared/constants` — never read `process.env` elsewhere.
 */
export const ENV = {
  NODE_ENV: parsedEnv.NODE_ENV,
  PORT: parsedEnv.PORT,
  LOG_LEVEL: parsedEnv.LOG_LEVEL,
  API_VERSION: parsedEnv.API_VERSION,
  CORS_ORIGIN: parsedEnv.CORS_ORIGIN,
  DATABASE_URL: parsedEnv.DATABASE_URL,
  JWT_SECRET: parsedEnv.JWT_SECRET,
  JWT_EXPIRES_IN: parsedEnv.JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET: parsedEnv.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: parsedEnv.JWT_REFRESH_EXPIRES_IN,
  SUPER_ADMIN_EMAIL: parsedEnv.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD: parsedEnv.SUPER_ADMIN_PASSWORD,
  SUPER_ADMIN_FIRST_NAME: parsedEnv.SUPER_ADMIN_FIRST_NAME,
  SUPER_ADMIN_LAST_NAME: parsedEnv.SUPER_ADMIN_LAST_NAME,
  UPLOAD_DIR: parsedEnv.UPLOAD_DIR,
} as const;

/** Returns true when running in development mode. */
export const isDevelopment = (): boolean => ENV.NODE_ENV === 'development';

/** Returns true when running in production mode. */
export const isProduction = (): boolean => ENV.NODE_ENV === 'production';

/** Returns true when running tests. */
export const isTest = (): boolean => ENV.NODE_ENV === 'test';
