import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';

import { validateRequestMiddleware } from '@/shared/middleware';
import { AuthMiddleware } from '@/modules/auth';

import { BatchAllocationController } from './batch-allocation.controller';
import {
  allocationIdParamsSchema,
  createAllocationBodySchema,
  listAllocationsQuerySchema,
  updateAllocationBodySchema,
} from './batch-allocation.validation';

const asyncHandler =
  (handler: (request: Request, response: Response) => Promise<void>) =>
  (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response).catch(next);
  };

/**
 * Registers batch allocation routes under /batch-allocations (auth required).
 */
export const createBatchAllocationRoutes = (): Router => {
  const router = Router();
  const batchAllocationController = container.resolve(BatchAllocationController);
  const authMiddleware = container.resolve(AuthMiddleware);

  router.use(authMiddleware.requireAuth);

  /**
   * @openapi
   * /batch-allocations:
   *   get:
   *     tags: [BatchAllocations]
   *     summary: List batch allocations by farm or supply chain
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: farmId
   *         schema:
   *           type: string
   *       - in: query
   *         name: supplyChainId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Batch allocation list
   */
  router.get(
    '/',
    validateRequestMiddleware(listAllocationsQuerySchema, 'query'),
    asyncHandler(batchAllocationController.list),
  );

  /**
   * @openapi
   * /batch-allocations:
   *   post:
   *     tags: [BatchAllocations]
   *     summary: Create a batch allocation
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       201:
   *         description: Batch allocation created
   */
  router.post(
    '/',
    validateRequestMiddleware(createAllocationBodySchema, 'body'),
    asyncHandler(batchAllocationController.create),
  );

  /**
   * @openapi
   * /batch-allocations/{id}:
   *   patch:
   *     tags: [BatchAllocations]
   *     summary: Update a batch allocation
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
   *         description: Batch allocation updated
   */
  router.patch(
    '/:id',
    validateRequestMiddleware(allocationIdParamsSchema, 'params'),
    validateRequestMiddleware(updateAllocationBodySchema, 'body'),
    asyncHandler(batchAllocationController.update),
  );

  /**
   * @openapi
   * /batch-allocations/{id}:
   *   delete:
   *     tags: [BatchAllocations]
   *     summary: Delete a batch allocation
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
   *         description: Batch allocation deleted
   */
  router.delete(
    '/:id',
    validateRequestMiddleware(allocationIdParamsSchema, 'params'),
    asyncHandler(batchAllocationController.remove),
  );

  return router;
};
