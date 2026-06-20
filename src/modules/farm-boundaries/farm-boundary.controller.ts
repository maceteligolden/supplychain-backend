import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { ResponseUtil } from '@/shared/utils';

import { FarmBoundaryService } from './farm-boundary.service';
import { IUpsertFarmBoundaryInput } from './farm-boundary.interface';

/**
 * FarmBoundaryController maps HTTP boundary requests to FarmBoundaryService.
 */
@injectable()
export class FarmBoundaryController {
  constructor(
    @inject(FarmBoundaryService)
    private readonly farmBoundaryService: FarmBoundaryService,
  ) {}

  get = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.farmBoundaryService.getBoundary(id);
    ResponseUtil.success(response, output);
  };

  upsert = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const input = request.body as IUpsertFarmBoundaryInput;
    const output = await this.farmBoundaryService.upsertBoundary(id, input);
    ResponseUtil.success(response, output);
  };

  remove = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.farmBoundaryService.deleteBoundary(id);
    ResponseUtil.success(response, output);
  };

  geocode = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.farmBoundaryService.geocodeFarm(id);
    ResponseUtil.success(response, output);
  };
}
