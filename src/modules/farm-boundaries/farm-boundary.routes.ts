import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';

import { validateRequestMiddleware } from '@/shared/middleware';
import { AuthMiddleware } from '@/modules/auth';

import { FarmBoundaryController } from './farm-boundary.controller';
import {
  farmParentParamsSchema,
  upsertFarmBoundaryBodySchema,
} from './farm-boundary.validation';

const asyncHandler =
  (handler: (request: Request, response: Response) => Promise<void>) =>
  (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response).catch(next);
  };

/**
 * Registers nested farm boundary routes under /farms/:id/boundary.
 */
export const createFarmBoundaryRoutes = (): Router => {
  const router = Router({ mergeParams: true });
  const controller = container.resolve(FarmBoundaryController);
  const authMiddleware = container.resolve(AuthMiddleware);

  router.use(authMiddleware.requireAuth);

  router.get(
    '/',
    validateRequestMiddleware(farmParentParamsSchema, 'params'),
    asyncHandler(controller.get),
  );

  router.put(
    '/',
    validateRequestMiddleware(farmParentParamsSchema, 'params'),
    validateRequestMiddleware(upsertFarmBoundaryBodySchema, 'body'),
    asyncHandler(controller.upsert),
  );

  router.delete(
    '/',
    validateRequestMiddleware(farmParentParamsSchema, 'params'),
    asyncHandler(controller.remove),
  );

  return router;
};
