import { inject, injectable } from 'tsyringe';

import { BadRequestError, NotFoundError } from '@/shared/errors';
import { BatchRepository } from '@/modules/batches/batch.repository';
import { deriveBatchStatus } from '@/modules/batches/batch.util';
import { SupplyChainRepository } from '@/modules/supply-chains/supply-chain.repository';

import {
  IAllocationOutput,
  IAllocationRecord,
  ICreateAllocationInput,
  IDeleteAllocationOutput,
  IGetAllocationsOutput,
  IUpdateAllocationInput,
} from './batch-allocation.interface';
import { BatchAllocationRepository } from './batch-allocation.repository';

const mapAllocationToOutput = (record: IAllocationRecord): IAllocationOutput => ({
  id: record.id,
  batchId: record.batchId,
  supplyChainId: record.supplyChainId,
  quantity: record.quantity,
  allocatedAt: record.allocatedAt.toISOString(),
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

/**
 * BatchAllocationService implements batch allocation business logic.
 */
@injectable()
export class BatchAllocationService {
  constructor(
    @inject(BatchAllocationRepository)
    private readonly batchAllocationRepository: BatchAllocationRepository,
    @inject(BatchRepository)
    private readonly batchRepository: BatchRepository,
    @inject(SupplyChainRepository)
    private readonly supplyChainRepository: SupplyChainRepository,
  ) {}

  /** Lists allocations filtered by farm or supply chain. */
  async listAllocations(query: {
    farmId?: string;
    supplyChainId?: string;
  }): Promise<IGetAllocationsOutput> {
    const records = query.farmId
      ? await this.batchAllocationRepository.findByFarmId(query.farmId)
      : await this.batchAllocationRepository.findBySupplyChainId(
          query.supplyChainId as string,
        );

    return {
      allocations: records.map(mapAllocationToOutput),
      total: records.length,
    };
  }

  /** Creates a batch allocation and syncs parent batch status. */
  async createAllocation(input: ICreateAllocationInput): Promise<IAllocationOutput> {
    const batch = await this.batchRepository.findById(input.batchId);

    if (!batch) {
      throw new NotFoundError('Batch not found');
    }

    const supplyChain = await this.supplyChainRepository.findById(input.supplyChainId);

    if (!supplyChain) {
      throw new NotFoundError('Supply chain not found');
    }

    if (supplyChain.status !== 'ACTIVE') {
      throw new BadRequestError('Supply chain is not active');
    }

    const existingTotal =
      await this.batchAllocationRepository.getTotalAllocatedForBatch(input.batchId);

    if (existingTotal + input.quantity > batch.quantity) {
      throw new BadRequestError('Allocation exceeds remaining batch quantity');
    }

    const allocatedAt = input.allocatedAt ? new Date(input.allocatedAt) : new Date();

    const record = await this.batchAllocationRepository.create({
      batchId: input.batchId,
      supplyChainId: input.supplyChainId,
      quantity: input.quantity,
      allocatedAt,
    });

    await this.syncBatchStatus(input.batchId);

    return mapAllocationToOutput(record);
  }

  /** Updates a batch allocation and syncs parent batch status. */
  async updateAllocation(
    id: string,
    input: IUpdateAllocationInput,
  ): Promise<IAllocationOutput> {
    const existing = await this.batchAllocationRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Batch allocation not found');
    }

    const batch = await this.batchRepository.findById(existing.batchId);

    if (!batch) {
      throw new NotFoundError('Batch not found');
    }

    const nextQuantity = input.quantity ?? existing.quantity;
    const otherTotal = await this.batchAllocationRepository.getTotalAllocatedForBatch(
      existing.batchId,
      id,
    );

    if (otherTotal + nextQuantity > batch.quantity) {
      throw new BadRequestError('Allocation exceeds remaining batch quantity');
    }

    const updated = await this.batchAllocationRepository.updateById(id, {
      quantity: input.quantity,
      allocatedAt: input.allocatedAt ? new Date(input.allocatedAt) : undefined,
    });

    if (!updated) {
      throw new NotFoundError('Batch allocation not found');
    }

    await this.syncBatchStatus(existing.batchId);

    return mapAllocationToOutput(updated);
  }

  /** Deletes a batch allocation and syncs parent batch status. */
  async deleteAllocation(id: string): Promise<IDeleteAllocationOutput> {
    const existing = await this.batchAllocationRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Batch allocation not found');
    }

    const deleted = await this.batchAllocationRepository.deleteById(id);

    if (!deleted) {
      throw new NotFoundError('Batch allocation not found');
    }

    await this.syncBatchStatus(existing.batchId);

    return { success: true, id };
  }

  private async syncBatchStatus(batchId: string): Promise<void> {
    const batch = await this.batchRepository.findById(batchId);

    if (!batch) {
      return;
    }

    const allocatedTotal =
      await this.batchAllocationRepository.getTotalAllocatedForBatch(batchId);
    const status = deriveBatchStatus(batch.quantity, allocatedTotal);

    await this.batchRepository.updateStatus(batchId, status);
  }
}
