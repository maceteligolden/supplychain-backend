import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';

import { validateRequestMiddleware } from '@/shared/middleware';
import { AuthMiddleware } from '@/modules/auth';

import { BatchController } from './batch.controller';
import {
  batchIdParamsSchema,
  createBatchBodySchema,
  listBatchesQuerySchema,
  updateBatchBodySchema,
} from './batch.validation';

const asyncHandler =
  (handler: (request: Request, response: Response) => Promise<void>) =>
  (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response).catch(next);
  };

/**
 * Registers batch routes under /batches (auth required).
 */
export const createBatchRoutes = (): Router => {
  const router = Router();
  const batchController = container.resolve(BatchController);
  const authMiddleware = container.resolve(AuthMiddleware);

  router.use(authMiddleware.requireAuth);

  /**
   * @openapi
   * /batches:
   *   get:
   *     tags: [Batches]
   *     summary: List batches for a farm
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: farmId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Batch list
   */
  router.get(
    '/',
    validateRequestMiddleware(listBatchesQuerySchema, 'query'),
    asyncHandler(batchController.list),
  );

  /**
   * @openapi
   * /batches:
   *   post:
   *     tags: [Batches]
   *     summary: Create a harvest batch
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       201:
   *         description: Batch created
   */
  router.post(
    '/',
    validateRequestMiddleware(createBatchBodySchema, 'body'),
    asyncHandler(batchController.create),
  );

  /**
   * @openapi
   * /batches/{id}:
   *   get:
   *     tags: [Batches]
   *     summary: Get batch by id
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
   *         description: Batch details
   */
  router.get(
    '/:id',
    validateRequestMiddleware(batchIdParamsSchema, 'params'),
    asyncHandler(batchController.getById),
  );

  /**
   * @openapi
   * /batches/{id}:
   *   patch:
   *     tags: [Batches]
   *     summary: Update a batch
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
   *         description: Batch updated
   */
  router.patch(
    '/:id',
    validateRequestMiddleware(batchIdParamsSchema, 'params'),
    validateRequestMiddleware(updateBatchBodySchema, 'body'),
    asyncHandler(batchController.update),
  );

  /**
   * @openapi
   * /batches/{id}:
   *   delete:
   *     tags: [Batches]
   *     summary: Delete a batch
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
   *         description: Batch deleted
   */
  router.delete(
    '/:id',
    validateRequestMiddleware(batchIdParamsSchema, 'params'),
    asyncHandler(batchController.remove),
  );

  return router;
};
