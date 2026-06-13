import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';

import { AuthMiddleware } from '@/modules/auth';

import { SupplyChainController } from './supply-chain.controller';

const asyncHandler =
  (handler: (request: Request, response: Response) => Promise<void>) =>
  (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response).catch(next);
  };

/**
 * Registers read-only supply chain routes under /supply-chains.
 */
export const createSupplyChainRoutes = (): Router => {
  const router = Router();
  const supplyChainController = container.resolve(SupplyChainController);
  const authMiddleware = container.resolve(AuthMiddleware);

  router.use(authMiddleware.requireAuth);

  router.get('/', asyncHandler(supplyChainController.list));

  return router;
};
