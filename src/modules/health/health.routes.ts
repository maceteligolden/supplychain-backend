import { Router } from 'express';
import { container } from 'tsyringe';

import { HealthController } from './health.controller';

/**
 * Registers health check routes.
 */
export const createHealthRoutes = (): Router => {
  const router = Router();
  const healthController = container.resolve(HealthController);

  /**
   * @openapi
   * /health:
   *   get:
   *     tags: [Health]
   *     summary: Service health check
   *     responses:
   *       200:
   *         description: Service is healthy
   */
  router.get('/', healthController.getHealth);

  return router;
};
