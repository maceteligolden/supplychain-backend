import { injectable } from 'tsyringe';

import { BatchStatus } from '@/shared/constants';
import { prismaClient } from '@/shared/database';

import { IBatchRecord } from './batch.interface';

/**
 * BatchRepository handles PostgreSQL persistence for harvest batches.
 */
@injectable()
export class BatchRepository {
  /** Finds all batches for a farm sorted by harvest date descending. */
  async findByFarmId(farmId: string): Promise<IBatchRecord[]> {
    return prismaClient.batch.findMany({
      where: { farmId },
      orderBy: [{ harvestDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /** Returns total batch count for a farm. */
  async countByFarmId(farmId: string): Promise<number> {
    return prismaClient.batch.count({ where: { farmId } });
  }

  /** Finds a batch by id. */
  async findById(id: string): Promise<IBatchRecord | null> {
    return prismaClient.batch.findUnique({ where: { id } });
  }

  /** Finds a batch by globally unique batch number. */
  async findByBatchNumber(batchNumber: string): Promise<IBatchRecord | null> {
    return prismaClient.batch.findUnique({
      where: { batchNumber: batchNumber.toUpperCase() },
    });
  }

  /** Returns batch numbers for a farm — used when generating the next number. */
  async findBatchNumbersByFarmId(farmId: string): Promise<string[]> {
    const rows = await prismaClient.batch.findMany({
      where: { farmId },
      select: { batchNumber: true },
    });

    return rows.map((row: { batchNumber: string }) => row.batchNumber);
  }

  /** Sums allocated quantity across all supply chains for a batch. */
  async sumAllocatedQuantity(batchId: string): Promise<number> {
    const aggregate = await prismaClient.batchAllocation.aggregate({
      where: { batchId },
      _sum: { quantity: true },
    });

    return aggregate._sum.quantity ?? 0;
  }

  /** Creates a new batch row. */
  async create(input: {
    batchNumber: string;
    farmId: string;
    commodityId: string;
    harvestDate: string;
    quantity: number;
    unit: IBatchRecord['unit'];
    status?: BatchStatus;
  }): Promise<IBatchRecord> {
    return prismaClient.batch.create({
      data: {
        batchNumber: input.batchNumber.toUpperCase(),
        farmId: input.farmId,
        commodityId: input.commodityId,
        harvestDate: input.harvestDate,
        quantity: input.quantity,
        unit: input.unit,
        status: input.status ?? 'CREATED',
      },
    });
  }

  /** Updates mutable batch fields by id. */
  async updateById(
    id: string,
    input: {
      harvestDate?: string;
      quantity?: number;
      status?: BatchStatus;
    },
  ): Promise<IBatchRecord | null> {
    try {
      return await prismaClient.batch.update({
        where: { id },
        data: {
          harvestDate: input.harvestDate,
          quantity: input.quantity,
          status: input.status,
        },
      });
    } catch {
      return null;
    }
  }

  /** Updates only the allocation status of a batch. */
  async updateStatus(id: string, status: BatchStatus): Promise<IBatchRecord | null> {
    try {
      return await prismaClient.batch.update({
        where: { id },
        data: { status },
      });
    } catch {
      return null;
    }
  }

  /** Deletes a batch by id. Returns true when a row was removed. */
  async deleteById(id: string): Promise<boolean> {
    try {
      await prismaClient.batch.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
