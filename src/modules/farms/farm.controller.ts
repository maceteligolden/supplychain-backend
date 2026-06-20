import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { HTTP_STATUS } from '@/shared/constants';
import { ResponseUtil } from '@/shared/utils';

import { ICreateFarmInput, IUpdateFarmInput } from './farm.interface';
import { FarmService } from './farm.service';
import { FarmBoundaryService } from '@/modules/farm-boundaries/farm-boundary.service';

/**
 * FarmController maps HTTP farm requests to FarmService.
 */
@injectable()
export class FarmController {
  constructor(
    @inject(FarmService) private readonly farmService: FarmService,
    @inject(FarmBoundaryService)
    private readonly farmBoundaryService: FarmBoundaryService,
  ) {}

  /** Handles GET /farms — returns all farms. */
  list = async (_request: Request, response: Response): Promise<void> => {
    const output = await this.farmService.listFarms();
    ResponseUtil.success(response, output);
  };

  /** Handles GET /farms/:id — returns one farm. */
  getById = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.farmService.getFarmById(id);
    ResponseUtil.success(response, output);
  };

  /** Handles POST /farms — creates a farm. */
  create = async (request: Request, response: Response): Promise<void> => {
    const input = request.body as ICreateFarmInput;
    const output = await this.farmService.createFarm(input);
    ResponseUtil.success(response, output, undefined, HTTP_STATUS.CREATED);
  };

  /** Handles PATCH /farms/:id — updates a farm. */
  update = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const input = request.body as IUpdateFarmInput;
    const output = await this.farmService.updateFarm(id, input);
    ResponseUtil.success(response, output);
  };

  /** Handles DELETE /farms/:id — removes a farm. */
  remove = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.farmService.deleteFarm(id);
    ResponseUtil.success(response, output);
  };

  /** Handles GET /farms/:id/geocode — geocodes farm address for map centering. */
  geocode = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.farmBoundaryService.geocodeFarm(id);
    ResponseUtil.success(response, output);
  };
}
