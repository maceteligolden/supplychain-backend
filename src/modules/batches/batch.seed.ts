import { prismaClient } from '@/shared/database';
import { createChildLogger } from '@/shared/utils';

const seedLogger = createChildLogger('batch-seed');

const DEFAULT_BATCHES = [
  {
    farmCode: 'ASHANTI_COCOA_FARM',
    commodityCode: 'COCOA',
    batchNumber: 'BATCH_ASHANTI_COCOA_FARM_2025_001',
    harvestDate: '2025-02-01',
    quantity: 5000,
    status: 'PARTIALLY_ALLOCATED' as const,
  },
  {
    farmCode: 'KORDOFAN_GUM_FARM',
    commodityCode: 'GUM_ARABIC',
    batchNumber: 'BATCH_KORDOFAN_GUM_FARM_2025_001',
    harvestDate: '2025-02-05',
    quantity: 2000,
    status: 'PARTIALLY_ALLOCATED' as const,
  },
];

/**
 * Idempotently seeds default batches when the table is empty.
 * Looks up farms by code and commodities by code.
 */
export const seedBatchesIfEmpty = async (): Promise<void> => {
  const existingCount = await prismaClient.batch.count();

  if (existingCount > 0) {
    return;
  }

  for (const batch of DEFAULT_BATCHES) {
    const farm = await prismaClient.farm.findUnique({
      where: { code: batch.farmCode },
    });

    if (!farm) {
      seedLogger.warn(
        { farmCode: batch.farmCode },
        'Skipping batch seed — farm not found',
      );
      continue;
    }

    const commodity = await prismaClient.commodity.findUnique({
      where: { code: batch.commodityCode },
    });

    if (!commodity) {
      seedLogger.warn(
        { commodityCode: batch.commodityCode },
        'Skipping batch seed — commodity not found',
      );
      continue;
    }

    await prismaClient.batch.create({
      data: {
        batchNumber: batch.batchNumber,
        farmId: farm.id,
        commodityId: commodity.id,
        harvestDate: batch.harvestDate,
        quantity: batch.quantity,
        unit: commodity.unit,
        status: batch.status,
      },
    });
  }

  seedLogger.info('Default batches seeded');
};
