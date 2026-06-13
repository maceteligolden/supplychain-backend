import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';

import { validateRequestMiddleware } from '@/shared/middleware';
import { AuthMiddleware } from '@/modules/auth';

import { ActorController } from './actor.controller';
import {
  actorIdParamsSchema,
  createActorBodySchema,
  updateActorBodySchema,
} from './actor.validation';

const asyncHandler =
  (handler: (request: Request, response: Response) => Promise<void>) =>
  (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response).catch(next);
  };

/**
 * Registers actor routes under /actors (auth required).
 */
export const createActorRoutes = (): Router => {
  const router = Router();
  const actorController = container.resolve(ActorController);
  const authMiddleware = container.resolve(AuthMiddleware);

  router.use(authMiddleware.requireAuth);

  /**
   * @openapi
   * /actors:
   *   get:
   *     tags: [Actors]
   *     summary: List all actors
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Actor list
   */
  router.get('/', asyncHandler(actorController.list));

  /**
   * @openapi
   * /actors:
   *   post:
   *     tags: [Actors]
   *     summary: Create an actor
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       201:
   *         description: Actor created
   */
  router.post(
    '/',
    validateRequestMiddleware(createActorBodySchema, 'body'),
    asyncHandler(actorController.create),
  );

  /**
   * @openapi
   * /actors/{id}/involvement:
   *   get:
   *     tags: [Actors]
   *     summary: Get actor supply chain involvement
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
   *         description: Actor involvement summary
   */
  router.get(
    '/:id/involvement',
    validateRequestMiddleware(actorIdParamsSchema, 'params'),
    asyncHandler(actorController.getInvolvement),
  );

  /**
   * @openapi
   * /actors/{id}:
   *   get:
   *     tags: [Actors]
   *     summary: Get actor by id
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
   *         description: Actor details
   */
  router.get(
    '/:id',
    validateRequestMiddleware(actorIdParamsSchema, 'params'),
    asyncHandler(actorController.getById),
  );

  /**
   * @openapi
   * /actors/{id}:
   *   patch:
   *     tags: [Actors]
   *     summary: Update an actor
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
   *         description: Actor updated
   */
  router.patch(
    '/:id',
    validateRequestMiddleware(actorIdParamsSchema, 'params'),
    validateRequestMiddleware(updateActorBodySchema, 'body'),
    asyncHandler(actorController.update),
  );

  /**
   * @openapi
   * /actors/{id}:
   *   delete:
   *     tags: [Actors]
   *     summary: Delete an actor
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
   *         description: Actor deleted
   */
  router.delete(
    '/:id',
    validateRequestMiddleware(actorIdParamsSchema, 'params'),
    asyncHandler(actorController.remove),
  );

  return router;
};
