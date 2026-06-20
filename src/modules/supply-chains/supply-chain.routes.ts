import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';

import { validateRequestMiddleware } from '@/shared/middleware';
import { AuthMiddleware } from '@/modules/auth';
import { createSupplyChainEventRoutes } from '@/modules/supply-chain-events/supply-chain-event.routes';

import { SupplyChainController } from './supply-chain.controller';
import {
  createSupplyChainBodySchema,
  supplyChainIdParamsSchema,
  syncSupplyChainAllocationsBodySchema,
  updateSupplyChainBodySchema,
} from './supply-chain.validation';

const asyncHandler =
  (handler: (request: Request, response: Response) => Promise<void>) =>
  (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response).catch(next);
  };

/**
 * Registers supply chain routes under /supply-chains (auth required).
 */
export const createSupplyChainRoutes = (): Router => {
  const router = Router();
  const supplyChainController = container.resolve(SupplyChainController);
  const authMiddleware = container.resolve(AuthMiddleware);

  router.use(authMiddleware.requireAuth);

  router.get('/', asyncHandler(supplyChainController.list));

  router.post(
    '/',
    validateRequestMiddleware(createSupplyChainBodySchema, 'body'),
    asyncHandler(supplyChainController.create),
  );

  router.use('/:id/events', createSupplyChainEventRoutes());

  router.get(
    '/:id/risk-summary',
    validateRequestMiddleware(supplyChainIdParamsSchema, 'params'),
    asyncHandler(supplyChainController.getRiskSummary),
  );

  router.get(
    '/:id/report',
    validateRequestMiddleware(supplyChainIdParamsSchema, 'params'),
    asyncHandler(supplyChainController.getReport),
  );

  router.get(
    '/:id',
    validateRequestMiddleware(supplyChainIdParamsSchema, 'params'),
    asyncHandler(supplyChainController.getById),
  );

  router.patch(
    '/:id',
    validateRequestMiddleware(supplyChainIdParamsSchema, 'params'),
    validateRequestMiddleware(updateSupplyChainBodySchema, 'body'),
    asyncHandler(supplyChainController.update),
  );

  router.delete(
    '/:id',
    validateRequestMiddleware(supplyChainIdParamsSchema, 'params'),
    asyncHandler(supplyChainController.remove),
  );

  router.put(
    '/:id/allocations',
    validateRequestMiddleware(supplyChainIdParamsSchema, 'params'),
    validateRequestMiddleware(syncSupplyChainAllocationsBodySchema, 'body'),
    asyncHandler(supplyChainController.syncAllocations),
  );

  return router;
};
