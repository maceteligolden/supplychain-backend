import { prismaClient } from '@/shared/database';
import { createChildLogger } from '@/shared/utils';

import { deriveBatchStatus } from '@/modules/batches/batch.util';

const seedLogger = createChildLogger('batch-allocation-seed');

const DEFAULT_ALLOCATIONS = [
  {
    batchNumber: 'BATCH_ASHANTI_COCOA_FARM_2025_001',
    supplyChainCode: 'GH_COCOA_EXPORT',
    quantity: 3000,
    allocatedAt: '2025-02-02T10:00:00.000Z',
  },
  {
    batchNumber: 'BATCH_KORDOFAN_GUM_FARM_2025_001',
    supplyChainCode: 'SD_GUM_EXPORT',
    quantity: 1500,
    allocatedAt: '2025-02-06T11:00:00.000Z',
  },
];

/**
 * Idempotently seeds default batch allocations when the table is empty.
 */
export const seedBatchAllocationsIfEmpty = async (): Promise<void> => {
  const existingCount = await prismaClient.batchAllocation.count();

  if (existingCount > 0) {
    return;
  }

  for (const allocation of DEFAULT_ALLOCATIONS) {
    const batch = await prismaClient.batch.findUnique({
      where: { batchNumber: allocation.batchNumber },
    });

    if (!batch) {
      seedLogger.warn(
        `Batch ${allocation.batchNumber} not found — skipping allocation seed`,
      );
      continue;
    }

    const supplyChain = await prismaClient.supplyChain.findUnique({
      where: { code: allocation.supplyChainCode },
    });

    if (!supplyChain) {
      seedLogger.warn(
        `Supply chain ${allocation.supplyChainCode} not found — skipping allocation seed`,
      );
      continue;
    }

    await prismaClient.batchAllocation.create({
      data: {
        batchId: batch.id,
        supplyChainId: supplyChain.id,
        quantity: allocation.quantity,
        allocatedAt: new Date(allocation.allocatedAt),
      },
    });

    const allocatedTotal = await prismaClient.batchAllocation.aggregate({
      where: { batchId: batch.id },
      _sum: { quantity: true },
    });

    await prismaClient.batch.update({
      where: { id: batch.id },
      data: {
        status: deriveBatchStatus(batch.quantity, allocatedTotal._sum.quantity ?? 0),
      },
    });
  }

  seedLogger.info('Default batch allocations seeded');
};
