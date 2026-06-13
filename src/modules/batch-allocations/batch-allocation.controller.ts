import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { HTTP_STATUS } from '@/shared/constants';
import { ResponseUtil } from '@/shared/utils';

import {
  ICreateAllocationInput,
  IUpdateAllocationInput,
} from './batch-allocation.interface';
import { BatchAllocationService } from './batch-allocation.service';

/**
 * BatchAllocationController maps HTTP batch allocation requests to BatchAllocationService.
 */
@injectable()
export class BatchAllocationController {
  constructor(
    @inject(BatchAllocationService)
    private readonly batchAllocationService: BatchAllocationService,
  ) {}

  /** Handles GET /batch-allocations — lists allocations by farm or supply chain. */
  list = async (request: Request, response: Response): Promise<void> => {
    const { farmId, supplyChainId } = request.query as {
      farmId?: string;
      supplyChainId?: string;
    };
    const output = await this.batchAllocationService.listAllocations({
      farmId,
      supplyChainId,
    });
    ResponseUtil.success(response, output);
  };

  /** Handles POST /batch-allocations — creates an allocation. */
  create = async (request: Request, response: Response): Promise<void> => {
    const input = request.body as ICreateAllocationInput;
    const output = await this.batchAllocationService.createAllocation(input);
    ResponseUtil.success(response, output, undefined, HTTP_STATUS.CREATED);
  };

  /** Handles PATCH /batch-allocations/:id — updates an allocation. */
  update = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const input = request.body as IUpdateAllocationInput;
    const output = await this.batchAllocationService.updateAllocation(id, input);
    ResponseUtil.success(response, output);
  };

  /** Handles DELETE /batch-allocations/:id — removes an allocation. */
  remove = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.batchAllocationService.deleteAllocation(id);
    ResponseUtil.success(response, output);
  };
}
