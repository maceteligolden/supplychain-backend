import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';

import { validateRequestMiddleware } from '@/shared/middleware';
import { AuthMiddleware } from '@/modules/auth';

import { SupplyChainEventController } from './supply-chain-event.controller';
import {
  createSupplyChainEventBodySchema,
  supplyChainEventIdParamsSchema,
  supplyChainEventParentParamsSchema,
  updateSupplyChainEventBodySchema,
} from './supply-chain-event.validation';

const asyncHandler =
  (handler: (request: Request, response: Response) => Promise<void>) =>
  (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response).catch(next);
  };

/**
 * Registers nested supply chain event routes under /supply-chains/:id/events.
 */
export const createSupplyChainEventRoutes = (): Router => {
  const router = Router({ mergeParams: true });
  const supplyChainEventController = container.resolve(SupplyChainEventController);
  const authMiddleware = container.resolve(AuthMiddleware);

  router.use(authMiddleware.requireAuth);

  router.get(
    '/',
    validateRequestMiddleware(supplyChainEventParentParamsSchema, 'params'),
    asyncHandler(supplyChainEventController.list),
  );

  router.post(
    '/',
    validateRequestMiddleware(supplyChainEventParentParamsSchema, 'params'),
    validateRequestMiddleware(createSupplyChainEventBodySchema, 'body'),
    asyncHandler(supplyChainEventController.create),
  );

  router.patch(
    '/:eventId',
    validateRequestMiddleware(supplyChainEventIdParamsSchema, 'params'),
    validateRequestMiddleware(updateSupplyChainEventBodySchema, 'body'),
    asyncHandler(supplyChainEventController.update),
  );

  return router;
};
