import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { HTTP_STATUS } from '@/shared/constants';
import { ResponseUtil } from '@/shared/utils';

import {
  ICreateSupplyChainEventInput,
  IUpdateSupplyChainEventInput,
} from './supply-chain-event.interface';
import { SupplyChainEventService } from './supply-chain-event.service';

/**
 * SupplyChainEventController maps HTTP event requests to SupplyChainEventService.
 */
@injectable()
export class SupplyChainEventController {
  constructor(
    @inject(SupplyChainEventService)
    private readonly supplyChainEventService: SupplyChainEventService,
  ) {}

  /** Handles GET /supply-chains/:id/events. */
  list = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.supplyChainEventService.listEventsBySupplyChainId(id);
    ResponseUtil.success(response, output);
  };

  /** Handles POST /supply-chains/:id/events. */
  create = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const input = request.body as ICreateSupplyChainEventInput;
    const output = await this.supplyChainEventService.createEvent(id, input);
    ResponseUtil.success(response, output, undefined, HTTP_STATUS.CREATED);
  };

  /** Handles PATCH /supply-chains/:id/events/:eventId. */
  update = async (request: Request, response: Response): Promise<void> => {
    const { id, eventId } = request.params as { id: string; eventId: string };
    const input = request.body as IUpdateSupplyChainEventInput;
    const output = await this.supplyChainEventService.updateEvent(id, eventId, input);
    ResponseUtil.success(response, output);
  };
}
