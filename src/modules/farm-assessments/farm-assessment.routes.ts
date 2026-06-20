import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';

import { validateRequestMiddleware } from '@/shared/middleware';
import { AuthMiddleware } from '@/modules/auth';

import { FarmAssessmentController } from './farm-assessment.controller';
import {
  farmAssessmentIdParamsSchema,
  farmParentParamsSchema,
} from './farm-assessment.validation';

const asyncHandler =
  (handler: (request: Request, response: Response) => Promise<void>) =>
  (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response).catch(next);
  };

/**
 * Registers nested farm assessment routes under /farms/:id/assessments.
 */
export const createFarmAssessmentRoutes = (): Router => {
  const router = Router({ mergeParams: true });
  const controller = container.resolve(FarmAssessmentController);
  const authMiddleware = container.resolve(AuthMiddleware);

  router.use(authMiddleware.requireAuth);

  router.get(
    '/',
    validateRequestMiddleware(farmParentParamsSchema, 'params'),
    asyncHandler(controller.list),
  );

  router.post(
    '/',
    validateRequestMiddleware(farmParentParamsSchema, 'params'),
    asyncHandler(controller.run),
  );

  router.get(
    '/:assessmentId',
    validateRequestMiddleware(farmAssessmentIdParamsSchema, 'params'),
    asyncHandler(controller.getById),
  );

  router.get(
    '/:assessmentId/map-context',
    validateRequestMiddleware(farmAssessmentIdParamsSchema, 'params'),
    asyncHandler(controller.mapContext),
  );

  return router;
};

/**
 * Registers land-cover timeline route under /farms/:id/land-cover-timeline.
 */
export const createFarmLandCoverRoutes = (): Router => {
  const router = Router({ mergeParams: true });
  const controller = container.resolve(FarmAssessmentController);
  const authMiddleware = container.resolve(AuthMiddleware);

  router.use(authMiddleware.requireAuth);

  router.get(
    '/',
    validateRequestMiddleware(farmParentParamsSchema, 'params'),
    asyncHandler(controller.landCoverTimeline),
  );

  return router;
};
