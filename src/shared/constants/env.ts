import 'dotenv/config';

import { z } from 'zod';

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
  MONGODB_URI: z.string().default('mongodb://localhost:27017/supplychain'),
  DATABASE_URL: z
    .string()
    .default(
      'postgresql://supplychain:supplychain@localhost:5432/supplychain?schema=public',
    ),
  JWT_SECRET: z.string().min(1).default('change-me-in-production'),
  JWT_EXPIRES_IN: z.string().default('15m'),
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
  MONGODB_URI: parsedEnv.MONGODB_URI,
  DATABASE_URL: parsedEnv.DATABASE_URL,
  JWT_SECRET: parsedEnv.JWT_SECRET,
  JWT_EXPIRES_IN: parsedEnv.JWT_EXPIRES_IN,
} as const;

/** Returns true when running in development mode. */
export const isDevelopment = (): boolean => ENV.NODE_ENV === 'development';

/** Returns true when running in production mode. */
export const isProduction = (): boolean => ENV.NODE_ENV === 'production';

/** Returns true when running tests. */
export const isTest = (): boolean => ENV.NODE_ENV === 'test';
