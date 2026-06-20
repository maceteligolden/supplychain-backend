import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';

import { validateRequestMiddleware } from '@/shared/middleware';
import { AuthMiddleware } from '@/modules/auth';

import { createFarmBoundaryRoutes } from '@/modules/farm-boundaries/farm-boundary.routes';
import {
  createFarmAssessmentRoutes,
  createFarmLandCoverRoutes,
} from '@/modules/farm-assessments/farm-assessment.routes';

import { FarmController } from './farm.controller';
import {
  createFarmBodySchema,
  farmIdParamsSchema,
  updateFarmBodySchema,
} from './farm.validation';

const asyncHandler =
  (handler: (request: Request, response: Response) => Promise<void>) =>
  (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response).catch(next);
  };

/**
 * Registers farm routes under /farms (auth required).
 */
export const createFarmRoutes = (): Router => {
  const router = Router();
  const farmController = container.resolve(FarmController);
  const authMiddleware = container.resolve(AuthMiddleware);

  router.use(authMiddleware.requireAuth);

  /**
   * @openapi
   * /farms:
   *   get:
   *     tags: [Farms]
   *     summary: List all farms
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Farm list
   */
  router.get('/', asyncHandler(farmController.list));

  /**
   * @openapi
   * /farms:
   *   post:
   *     tags: [Farms]
   *     summary: Create a farm
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       201:
   *         description: Farm created
   */
  router.post(
    '/',
    validateRequestMiddleware(createFarmBodySchema, 'body'),
    asyncHandler(farmController.create),
  );

  router.use('/:id/boundary', createFarmBoundaryRoutes());
  router.use('/:id/assessments', createFarmAssessmentRoutes());
  router.use('/:id/land-cover-timeline', createFarmLandCoverRoutes());

  router.get(
    '/:id/geocode',
    validateRequestMiddleware(farmIdParamsSchema, 'params'),
    asyncHandler(farmController.geocode),
  );

  /**
   * @openapi
   * /farms/{id}:
   *   get:
   *     tags: [Farms]
   *     summary: Get farm by id
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Farm details
   */
  router.get(
    '/:id',
    validateRequestMiddleware(farmIdParamsSchema, 'params'),
    asyncHandler(farmController.getById),
  );

  /**
   * @openapi
   * /farms/{id}:
   *   patch:
   *     tags: [Farms]
   *     summary: Update a farm
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Farm updated
   */
  router.patch(
    '/:id',
    validateRequestMiddleware(farmIdParamsSchema, 'params'),
    validateRequestMiddleware(updateFarmBodySchema, 'body'),
    asyncHandler(farmController.update),
  );

  /**
   * @openapi
   * /farms/{id}:
   *   delete:
   *     tags: [Farms]
   *     summary: Delete a farm
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Farm deleted
   */
  router.delete(
    '/:id',
    validateRequestMiddleware(farmIdParamsSchema, 'params'),
    asyncHandler(farmController.remove),
  );

  return router;
};
