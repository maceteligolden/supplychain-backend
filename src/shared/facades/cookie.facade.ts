import { Response } from 'express';

import {
  ACCESS_COOKIE_NAME,
  isProduction,
  REFRESH_COOKIE_NAME,
} from '@/shared/constants';
import {
  getAccessTokenMaxAgeSeconds,
  getRefreshTokenMaxAgeSeconds,
} from '@/shared/utils/jwt.util';

/** Pair of auth cookies set on login and refresh. */
export interface IAuthCookiePairInput {
  /** Short-lived access JWT value. */
  accessToken: string;
  /** Opaque refresh token value. */
  refreshToken: string;
}

/**
 * Facade for setting and clearing httpOnly authentication cookies.
 */
export class CookieFacade {
  /**
   * Sets access and refresh auth cookies on the response.
   */
  static setAuthCookies(
    response: Response,
    cookiePairInput: IAuthCookiePairInput,
  ): void {
    const secureFlag = isProduction();
    const accessMaxAgeSeconds = getAccessTokenMaxAgeSeconds();
    const refreshMaxAgeSeconds = getRefreshTokenMaxAgeSeconds();

    response.cookie(ACCESS_COOKIE_NAME, cookiePairInput.accessToken, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: 'lax',
      path: '/',
      maxAge: accessMaxAgeSeconds * 1000,
    });

    response.cookie(REFRESH_COOKIE_NAME, cookiePairInput.refreshToken, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshMaxAgeSeconds * 1000,
    });
  }

  /**
   * Clears access and refresh auth cookies from the response.
   */
  static clearAuthCookies(response: Response): void {
    const secureFlag = isProduction();

    response.clearCookie(ACCESS_COOKIE_NAME, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: 'lax',
      path: '/',
    });

    response.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: 'lax',
      path: '/',
    });
  }
}
