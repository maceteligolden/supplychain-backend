import { createHash, randomBytes } from 'node:crypto';

import jwt from 'jsonwebtoken';

import { ENV } from '@/shared/constants';

/** Payload embedded in access JWTs. */
export interface IAccessTokenPayload {
  /** Subject — authenticated user id. */
  sub: string;
  /** User role used for authorization checks. */
  role: string;
}

/**
 * Signs a short-lived access JWT for the authenticated user.
 */
export const signAccessToken = (payloadInput: IAccessTokenPayload): string =>
  jwt.sign(payloadInput, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

/**
 * Verifies an access JWT and returns its payload.
 */
export const verifyAccessToken = (accessTokenInput: string): IAccessTokenPayload => {
  const decoded = jwt.verify(accessTokenInput, ENV.JWT_SECRET);

  if (typeof decoded === 'string' || !decoded.sub || !decoded.role) {
    throw new Error('Invalid access token payload');
  }

  return {
    sub: decoded.sub,
    role: String(decoded.role),
  };
};

/**
 * Generates a cryptographically secure opaque refresh token.
 */
export const generateOpaqueRefreshToken = (): string => randomBytes(32).toString('hex');

/**
 * Hashes a refresh token for safe persistence.
 */
export const hashRefreshToken = (refreshTokenInput: string): string =>
  createHash('sha256').update(refreshTokenInput).digest('hex');

/**
 * Parses refresh token expiry duration from env into a Date.
 */
export const getRefreshTokenExpiryDate = (): Date => {
  const durationInput = ENV.JWT_REFRESH_EXPIRES_IN;
  const dayMatch = /^(\d+)d$/.exec(durationInput);
  if (dayMatch?.[1]) {
    const days = Number.parseInt(dayMatch[1], 10);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  const hourMatch = /^(\d+)h$/.exec(durationInput);
  if (hourMatch?.[1]) {
    const hours = Number.parseInt(hourMatch[1], 10);
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
};

/**
 * Converts JWT expires string to seconds for cookie max-age.
 */
export const getAccessTokenMaxAgeSeconds = (): number => {
  const durationInput = ENV.JWT_EXPIRES_IN;
  const minuteMatch = /^(\d+)m$/.exec(durationInput);
  if (minuteMatch?.[1]) {
    return Number.parseInt(minuteMatch[1], 10) * 60;
  }

  const hourMatch = /^(\d+)h$/.exec(durationInput);
  if (hourMatch?.[1]) {
    return Number.parseInt(hourMatch[1], 10) * 60 * 60;
  }

  return 15 * 60;
};

/**
 * Converts refresh expires string to seconds for cookie max-age.
 */
export const getRefreshTokenMaxAgeSeconds = (): number => {
  const durationInput = ENV.JWT_REFRESH_EXPIRES_IN;
  const dayMatch = /^(\d+)d$/.exec(durationInput);
  if (dayMatch?.[1]) {
    return Number.parseInt(dayMatch[1], 10) * 24 * 60 * 60;
  }

  return 7 * 24 * 60 * 60;
};
