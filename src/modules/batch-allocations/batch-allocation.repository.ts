import { injectable } from 'tsyringe';

import { prismaClient } from '@/shared/database';

import { IAllocationRecord } from './batch-allocation.interface';

/**
 * BatchAllocationRepository handles PostgreSQL persistence for batch allocations.
 */
@injectable()
export class BatchAllocationRepository {
  /** Returns all batch allocations sorted by allocatedAt descending. */
  async findAll(): Promise<IAllocationRecord[]> {
    return prismaClient.batchAllocation.findMany({
      orderBy: { allocatedAt: 'desc' },
    });
  }

  /** Finds a batch allocation by id. */
  async findById(id: string): Promise<IAllocationRecord | null> {
    return prismaClient.batchAllocation.findUnique({ where: { id } });
  }

  /** Returns allocations for batches belonging to a farm. */
  async findByFarmId(farmId: string): Promise<IAllocationRecord[]> {
    return prismaClient.batchAllocation.findMany({
      where: { batch: { farmId } },
      orderBy: { allocatedAt: 'desc' },
    });
  }

  /** Returns allocations for a supply chain. */
  async findBySupplyChainId(supplyChainId: string): Promise<IAllocationRecord[]> {
    return prismaClient.batchAllocation.findMany({
      where: { supplyChainId },
      orderBy: { allocatedAt: 'desc' },
    });
  }

  /** Sums allocated quantity for a batch, optionally excluding one allocation. */
  async getTotalAllocatedForBatch(
    batchId: string,
    excludeId?: string,
  ): Promise<number> {
    const result = await prismaClient.batchAllocation.aggregate({
      where: {
        batchId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      _sum: { quantity: true },
    });

    return result._sum.quantity ?? 0;
  }

  /** Creates a new batch allocation row. */
  async create(input: {
    batchId: string;
    supplyChainId: string;
    quantity: number;
    allocatedAt: Date;
  }): Promise<IAllocationRecord> {
    return prismaClient.batchAllocation.create({
      data: {
        batchId: input.batchId,
        supplyChainId: input.supplyChainId,
        quantity: input.quantity,
        allocatedAt: input.allocatedAt,
      },
    });
  }

  /** Updates a batch allocation by id. */
  async updateById(
    id: string,
    input: {
      quantity?: number;
      allocatedAt?: Date;
    },
  ): Promise<IAllocationRecord | null> {
    try {
      return await prismaClient.batchAllocation.update({
        where: { id },
        data: {
          quantity: input.quantity,
          allocatedAt: input.allocatedAt,
        },
      });
    } catch {
      return null;
    }
  }

  /** Finds allocation for a batch on a specific supply chain. */
  async findByBatchAndSupplyChain(
    batchId: string,
    supplyChainId: string,
  ): Promise<IAllocationRecord | null> {
    return prismaClient.batchAllocation.findFirst({
      where: { batchId, supplyChainId },
    });
  }

  /** Deletes all allocations for a supply chain. Returns affected batch ids. */
  async deleteAllBySupplyChainId(supplyChainId: string): Promise<string[]> {
    const existing = await prismaClient.batchAllocation.findMany({
      where: { supplyChainId },
      select: { batchId: true },
    });

    if (existing.length === 0) {
      return [];
    }

    await prismaClient.batchAllocation.deleteMany({ where: { supplyChainId } });

    return [...new Set(existing.map((row) => row.batchId))];
  }

  /** Deletes a batch allocation by id. Returns true when a row was removed. */
  async deleteById(id: string): Promise<boolean> {
    try {
      await prismaClient.batchAllocation.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
