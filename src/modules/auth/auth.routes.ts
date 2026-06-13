import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';

import { validateRequestMiddleware } from '@/shared/middleware';

import { AuthController } from './auth.controller';
import { AuthMiddleware } from './auth.middleware';
import { loginBodySchema } from './auth.validation';

const asyncHandler =
  (handler: (request: Request, response: Response) => Promise<void>) =>
  (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response).catch(next);
  };

/**
 * Registers authentication routes under /auth.
 */
export const createAuthRoutes = (): Router => {
  const router = Router();
  const authController = container.resolve(AuthController);
  const authMiddleware = container.resolve(AuthMiddleware);

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Super Admin login
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   */
  router.post(
    '/login',
    validateRequestMiddleware(loginBodySchema, 'body'),
    asyncHandler(authController.login),
  );

  /**
   * @openapi
   * /auth/refresh:
   *   post:
   *     tags: [Auth]
   *     summary: Rotate refresh token and issue new access token
   *     responses:
   *       200:
   *         description: Tokens refreshed
   */
  router.post('/refresh', asyncHandler(authController.refresh));

  /**
   * @openapi
   * /auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: Get current authenticated user
   *     responses:
   *       200:
   *         description: Current user profile
   */
  router.get(
    '/me',
    (request: Request, response: Response, next: NextFunction) => {
      void authController.trySilentRefresh(request, response, next);
    },
    authMiddleware.requireAuth,
    asyncHandler(authController.me),
  );

  /**
   * @openapi
   * /auth/logout:
   *   post:
   *     tags: [Auth]
   *     summary: Log out and revoke refresh tokens
   *     responses:
   *       200:
   *         description: Logout successful
   */
  router.post(
    '/logout',
    authMiddleware.requireAuth,
    asyncHandler(authController.logout),
  );

  return router;
};
