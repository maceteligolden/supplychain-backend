import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';

import { AuthMiddleware } from '@/modules/auth';

import { DashboardController } from './dashboard.controller';

const asyncHandler =
  (handler: (request: Request, response: Response) => Promise<void>) =>
  (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response).catch(next);
  };

/**
 * Registers dashboard routes under /dashboard (auth required).
 */
export const createDashboardRoutes = (): Router => {
  const router = Router();
  const dashboardController = container.resolve(DashboardController);
  const authMiddleware = container.resolve(AuthMiddleware);

  router.use(authMiddleware.requireAuth);

  /**
   * @openapi
   * /dashboard:
   *   get:
   *     tags: [Dashboard]
   *     summary: Get dashboard summary
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Dashboard summary
   */
  router.get('/', asyncHandler(dashboardController.getSummary));

  return router;
};
