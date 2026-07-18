import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';

import { AuthMiddleware } from '@/modules/auth';

import { GeocodeController } from './geocode.controller';

const asyncHandler =
  (handler: (request: Request, response: Response) => Promise<void>) =>
  (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response).catch(next);
  };

/**
 * Registers geocode routes under /geocode (auth required).
 */
export const createGeocodeRoutes = (): Router => {
  const router = Router();
  const geocodeController = container.resolve(GeocodeController);
  const authMiddleware = container.resolve(AuthMiddleware);

  router.use(authMiddleware.requireAuth);

  /**
   * @openapi
   * /geocode:
   *   get:
   *     tags: [Geocode]
   *     summary: Forward-geocode a free-text address query
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Geocode result
   *       400:
   *         description: Missing query
   *       404:
   *         description: Address not found
   */
  router.get('/', asyncHandler(geocodeController.geocode));

  return router;
};
