import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';

import { validateRequestMiddleware } from '@/shared/middleware';
import { AuthMiddleware } from '@/modules/auth';

import { CommodityController } from './commodity.controller';
import {
  commodityIdParamsSchema,
  createCommodityBodySchema,
  updateCommodityBodySchema,
} from './commodity.validation';
import { parseCommodityImageUpload } from './commodity.storage';

const asyncHandler =
  (handler: (request: Request, response: Response) => Promise<void>) =>
  (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response).catch(next);
  };

/**
 * Registers commodity routes under /commodities (auth required).
 */
export const createCommodityRoutes = (): Router => {
  const router = Router();
  const commodityController = container.resolve(CommodityController);
  const authMiddleware = container.resolve(AuthMiddleware);

  router.use(authMiddleware.requireAuth);

  /**
   * @openapi
   * /commodities:
   *   get:
   *     tags: [Commodities]
   *     summary: List all commodities
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Commodity list
   */
  router.get('/', asyncHandler(commodityController.list));

  /**
   * @openapi
   * /commodities:
   *   post:
   *     tags: [Commodities]
   *     summary: Create a commodity
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       201:
   *         description: Commodity created
   */
  router.post(
    '/',
    parseCommodityImageUpload,
    validateRequestMiddleware(createCommodityBodySchema, 'body'),
    asyncHandler(commodityController.create),
  );

  /**
   * @openapi
   * /commodities/{id}:
   *   get:
   *     tags: [Commodities]
   *     summary: Get commodity by id
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
   *         description: Commodity details
   */
  router.get(
    '/:id',
    validateRequestMiddleware(commodityIdParamsSchema, 'params'),
    asyncHandler(commodityController.getById),
  );

  /**
   * @openapi
   * /commodities/{id}:
   *   patch:
   *     tags: [Commodities]
   *     summary: Update a commodity
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
   *         description: Commodity updated
   */
  router.patch(
    '/:id',
    validateRequestMiddleware(commodityIdParamsSchema, 'params'),
    parseCommodityImageUpload,
    validateRequestMiddleware(updateCommodityBodySchema, 'body'),
    asyncHandler(commodityController.update),
  );

  /**
   * @openapi
   * /commodities/{id}:
   *   delete:
   *     tags: [Commodities]
   *     summary: Delete a commodity
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
   *         description: Commodity deleted
   */
  router.delete(
    '/:id',
    validateRequestMiddleware(commodityIdParamsSchema, 'params'),
    asyncHandler(commodityController.remove),
  );

  return router;
};
