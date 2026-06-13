import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { UnauthorizedError } from '@/shared/errors';
import { ACCESS_COOKIE_NAME } from '@/shared/constants';

import { AdminAuthService } from './admin-auth.service';

/**
 * AuthMiddleware verifies access tokens and attaches auth context to requests.
 */
@injectable()
export class AuthMiddleware {
  constructor(
    @inject(AdminAuthService) private readonly adminAuthService: AdminAuthService,
  ) {}

  /**
   * Requires a valid access token cookie on the request.
   */
  requireAuth = (request: Request, _response: Response, next: NextFunction): void => {
    const accessToken = request.cookies?.[ACCESS_COOKIE_NAME] as string | undefined;

    if (!accessToken) {
      next(new UnauthorizedError('Not authenticated'));
      return;
    }

    try {
      request.authUser = this.adminAuthService.verifyAccessToken(accessToken);
      next();
    } catch (error) {
      next(error);
    }
  };
}
