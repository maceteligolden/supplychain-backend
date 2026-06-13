import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { HTTP_STATUS } from '@/shared/constants';
import { ResponseUtil } from '@/shared/utils';

import { ICreateBatchInput, IUpdateBatchInput } from './batch.interface';
import { BatchService } from './batch.service';

/**
 * BatchController maps HTTP batch requests to BatchService.
 */
@injectable()
export class BatchController {
  constructor(@inject(BatchService) private readonly batchService: BatchService) {}

  /** Handles GET /batches?farmId= — returns batches for a farm. */
  list = async (request: Request, response: Response): Promise<void> => {
    const { farmId } = request.query as { farmId: string };
    const output = await this.batchService.listBatchesByFarmId(farmId);
    ResponseUtil.success(response, output);
  };

  /** Handles GET /batches/:id — returns one batch. */
  getById = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.batchService.getBatchById(id);
    ResponseUtil.success(response, output);
  };

  /** Handles POST /batches — creates a batch. */
  create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as ICreateBatchInput;
    const output = await this.batchService.createBatch(body);
    ResponseUtil.success(response, output, undefined, HTTP_STATUS.CREATED);
  };

  /** Handles PATCH /batches/:id — updates a batch. */
  update = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const body = request.body as IUpdateBatchInput;
    const output = await this.batchService.updateBatch(id, body);
    ResponseUtil.success(response, output);
  };

  /** Handles DELETE /batches/:id — removes a batch. */
  remove = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.batchService.deleteBatch(id);
    ResponseUtil.success(response, output);
  };
}
