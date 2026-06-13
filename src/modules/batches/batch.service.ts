import { inject, injectable } from 'tsyringe';

import { CommodityRepository } from '@/modules/commodities';
import { FarmRepository } from '@/modules/farms';
import { BadRequestError, NotFoundError } from '@/shared/errors';

import {
  IBatchCreationStep,
  IBatchOutput,
  ICreateBatchInput,
  ICreateBatchOutput,
  IDeleteBatchOutput,
  IGetBatchesOutput,
  IBatchRecord,
  IUpdateBatchInput,
} from './batch.interface';
import { BatchRepository } from './batch.repository';
import { deriveBatchStatus, generateBatchNumber } from './batch.util';

const mapBatchToOutput = (record: IBatchRecord): IBatchOutput => ({
  id: record.id,
  batchNumber: record.batchNumber,
  farmId: record.farmId,
  commodityId: record.commodityId,
  harvestDate: record.harvestDate,
  quantity: record.quantity,
  unit: record.unit,
  status: record.status,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

const buildCreationSteps = (batchNumber: string): IBatchCreationStep[] => [
  {
    id: 'create-batch',
    label: 'Harvest batch recorded',
    status: 'completed',
    detail: batchNumber,
  },
  {
    id: 'run-assessment',
    label: 'Deforestation assessment skipped',
    status: 'skipped',
    detail: 'Farm assessment workflow not enabled',
  },
  {
    id: 'complete',
    label: 'Batch workflow complete',
    status: 'completed',
  },
];

/**
 * BatchService implements harvest batch CRUD and creation workflow logic.
 */
@injectable()
export class BatchService {
  constructor(
    @inject(BatchRepository) private readonly batchRepository: BatchRepository,
    @inject(FarmRepository) private readonly farmRepository: FarmRepository,
    @inject(CommodityRepository)
    private readonly commodityRepository: CommodityRepository,
  ) {}

  /** Lists batches for a farm with total count. */
  async listBatchesByFarmId(farmId: string): Promise<IGetBatchesOutput> {
    const [records, total] = await Promise.all([
      this.batchRepository.findByFarmId(farmId),
      this.batchRepository.countByFarmId(farmId),
    ]);

    return {
      batches: records.map(mapBatchToOutput),
      total,
    };
  }

  /** Returns a single batch by id. */
  async getBatchById(id: string): Promise<IBatchOutput> {
    const record = await this.batchRepository.findById(id);

    if (!record) {
      throw new NotFoundError('Batch not found');
    }

    return mapBatchToOutput(record);
  }

  /** Creates a batch and returns the simplified creation workflow output. */
  async createBatch(input: ICreateBatchInput): Promise<ICreateBatchOutput> {
    const farm = await this.farmRepository.findById(input.farmId);

    if (!farm) {
      throw new BadRequestError('Farm not found', {
        issues: [{ path: 'farmId', message: 'Farm must exist' }],
      });
    }

    const farmCommodityIds = farm.commodityIds;

    if (farmCommodityIds.length === 0) {
      throw new BadRequestError('Farm has no commodities configured');
    }

    const resolvedCommodityId =
      input.commodityId ??
      (farmCommodityIds.length === 1 ? farmCommodityIds[0] : undefined);

    if (!resolvedCommodityId) {
      throw new BadRequestError(
        'Commodity is required when the farm grows multiple commodities',
        {
          issues: [
            {
              path: 'commodityId',
              message: 'Commodity is required when the farm grows multiple commodities',
            },
          ],
        },
      );
    }

    if (!farmCommodityIds.includes(resolvedCommodityId)) {
      throw new BadRequestError('Selected commodity is not grown on this farm', {
        issues: [
          {
            path: 'commodityId',
            message: 'Selected commodity is not grown on this farm',
          },
        ],
      });
    }

    const commodity = await this.commodityRepository.findById(resolvedCommodityId);

    if (!commodity) {
      throw new BadRequestError('Commodity not found', {
        issues: [{ path: 'commodityId', message: 'Commodity must exist' }],
      });
    }

    const batchNumber = await this.resolveBatchNumber({
      farmId: input.farmId,
      farmCode: farm.code,
      harvestDate: input.harvestDate,
      providedBatchNumber: input.batchNumber,
    });

    const record = await this.batchRepository.create({
      batchNumber,
      farmId: input.farmId,
      commodityId: resolvedCommodityId,
      harvestDate: input.harvestDate,
      quantity: input.quantity,
      unit: commodity.unit,
    });

    const batch = mapBatchToOutput(record);

    return {
      batch,
      assessment: null,
      steps: buildCreationSteps(batch.batchNumber),
    };
  }

  /** Updates an existing batch and recalculates allocation status. */
  async updateBatch(id: string, input: IUpdateBatchInput): Promise<IBatchOutput> {
    const existing = await this.batchRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Batch not found');
    }

    const quantity = input.quantity ?? existing.quantity;
    const allocatedTotal = await this.batchRepository.sumAllocatedQuantity(id);

    const updated = await this.batchRepository.updateById(id, {
      harvestDate: input.harvestDate,
      quantity: input.quantity,
      status: deriveBatchStatus(quantity, allocatedTotal),
    });

    if (!updated) {
      throw new NotFoundError('Batch not found');
    }

    return mapBatchToOutput(updated);
  }

  /** Recalculates and persists batch status from current allocations. */
  async setBatchStatusFromAllocation(
    batchId: string,
    allocatedTotal: number,
  ): Promise<IBatchOutput | null> {
    const batch = await this.batchRepository.findById(batchId);

    if (!batch) {
      return null;
    }

    const status = deriveBatchStatus(batch.quantity, allocatedTotal);
    const updated = await this.batchRepository.updateStatus(batchId, status);

    if (!updated) {
      return null;
    }

    return mapBatchToOutput(updated);
  }

  /** Deletes a batch by id. */
  async deleteBatch(id: string): Promise<IDeleteBatchOutput> {
    const existing = await this.batchRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Batch not found');
    }

    const deleted = await this.batchRepository.deleteById(id);

    if (!deleted) {
      throw new BadRequestError(
        'Cannot delete batch with existing supply chain allocations',
      );
    }

    return { success: true, id };
  }

  private async resolveBatchNumber(input: {
    farmId: string;
    farmCode: string;
    harvestDate: string;
    providedBatchNumber?: string;
  }): Promise<string> {
    if (input.providedBatchNumber) {
      const normalized = input.providedBatchNumber.toUpperCase();
      const taken = await this.batchRepository.findByBatchNumber(normalized);

      if (taken) {
        throw new BadRequestError('Batch number already exists', {
          issues: [{ path: 'batchNumber', message: 'Batch number must be unique' }],
        });
      }

      return normalized;
    }

    const existingBatchNumbers = await this.batchRepository.findBatchNumbersByFarmId(
      input.farmId,
    );

    return generateBatchNumber({
      farmCode: input.farmCode,
      harvestDate: input.harvestDate,
      existingBatchNumbers,
    });
  }
}
