import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { CookieFacade } from '@/shared/facades';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from '@/shared/constants';
import { UnauthorizedError } from '@/shared/errors';
import { ResponseUtil } from '@/shared/utils';

import { AdminAuthService } from './admin-auth.service';
import { ILoginInput } from './auth.interface';

/**
 * AuthController maps HTTP auth requests to AdminAuthService.
 */
@injectable()
export class AuthController {
  constructor(
    @inject(AdminAuthService) private readonly adminAuthService: AdminAuthService,
  ) {}

  /**
   * Handles POST /auth/login — validates credentials and sets auth cookies.
   */
  login = async (request: Request, response: Response): Promise<void> => {
    const loginInput = request.body as ILoginInput;
    const authResult = await this.adminAuthService.login(loginInput);

    CookieFacade.setAuthCookies(response, {
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
    });

    ResponseUtil.success(response, { user: authResult.user });
  };

  /**
   * Handles POST /auth/refresh — rotates tokens using the refresh cookie.
   */
  refresh = async (request: Request, response: Response): Promise<void> => {
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token missing');
    }

    const authResult = await this.adminAuthService.refreshSession(refreshToken);

    CookieFacade.setAuthCookies(response, {
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
    });

    ResponseUtil.success(response, { user: authResult.user });
  };

  /**
   * Handles GET /auth/me — returns the authenticated user profile.
   */
  me = async (request: Request, response: Response): Promise<void> => {
    const authUser = request.authUser;
    if (!authUser) {
      throw new UnauthorizedError('Not authenticated');
    }

    const userOutput = await this.adminAuthService.getProfile(authUser.userId);
    ResponseUtil.success(response, userOutput);
  };

  /**
   * Handles POST /auth/logout — revokes tokens and clears cookies.
   */
  logout = async (request: Request, response: Response): Promise<void> => {
    const authUser = request.authUser;
    if (!authUser) {
      throw new UnauthorizedError('Not authenticated');
    }

    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const logoutOutput = await this.adminAuthService.logout(authUser, refreshToken);

    CookieFacade.clearAuthCookies(response);
    ResponseUtil.success(response, logoutOutput);
  };

  /**
   * Attempts silent refresh when access token is missing but refresh cookie exists.
   */
  trySilentRefresh = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    const accessToken = request.cookies?.[ACCESS_COOKIE_NAME] as string | undefined;
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

    if (accessToken) {
      next();
      return;
    }

    if (!refreshToken) {
      next();
      return;
    }

    try {
      const authResult = await this.adminAuthService.refreshSession(refreshToken);
      CookieFacade.setAuthCookies(response, {
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
      });
      request.cookies[ACCESS_COOKIE_NAME] = authResult.accessToken;
      next();
    } catch {
      next();
    }
  };
}
