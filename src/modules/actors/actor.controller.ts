import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { HTTP_STATUS } from '@/shared/constants';
import { ResponseUtil } from '@/shared/utils';

import { ICreateActorInput, IUpdateActorInput } from './actor.interface';
import { ActorService } from './actor.service';

/**
 * ActorController maps HTTP actor requests to ActorService.
 */
@injectable()
export class ActorController {
  constructor(@inject(ActorService) private readonly actorService: ActorService) {}

  /** Handles GET /actors — returns all actors. */
  list = async (_request: Request, response: Response): Promise<void> => {
    const output = await this.actorService.listActors();
    ResponseUtil.success(response, output);
  };

  /** Handles GET /actors/:id — returns one actor. */
  getById = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.actorService.getActorById(id);
    ResponseUtil.success(response, output);
  };

  /** Handles GET /actors/:id/involvement — returns actor involvement summary. */
  getInvolvement = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.actorService.getActorInvolvement(id);
    ResponseUtil.success(response, output);
  };

  /** Handles POST /actors — creates an actor. */
  create = async (request: Request, response: Response): Promise<void> => {
    const input = request.body as ICreateActorInput;
    const output = await this.actorService.createActor(input);
    ResponseUtil.success(response, output, undefined, HTTP_STATUS.CREATED);
  };

  /** Handles PATCH /actors/:id — updates an actor. */
  update = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const input = request.body as IUpdateActorInput;
    const output = await this.actorService.updateActor(id, input);
    ResponseUtil.success(response, output);
  };

  /** Handles DELETE /actors/:id — removes an actor. */
  remove = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.actorService.deleteActor(id);
    ResponseUtil.success(response, output);
  };
}
