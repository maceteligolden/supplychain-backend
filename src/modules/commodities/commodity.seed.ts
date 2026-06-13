import { prismaClient } from '@/shared/database';
import { createChildLogger } from '@/shared/utils';

const seedLogger = createChildLogger('commodity-seed');

const DEFAULT_COMMODITIES = [
  {
    name: 'Cocoa',
    code: 'COCOA',
    unit: 'KG' as const,
    imageUrl: '',
  },
  {
    name: 'Gum Arabic',
    code: 'GUM_ARABIC',
    unit: 'KG' as const,
    imageUrl: '',
  },
];

/**
 * Idempotently seeds default commodities when the table is empty.
 */
export const seedCommoditiesIfEmpty = async (): Promise<void> => {
  const existingCount = await prismaClient.commodity.count();

  if (existingCount > 0) {
    return;
  }

  for (const commodity of DEFAULT_COMMODITIES) {
    await prismaClient.commodity.create({ data: commodity });
  }

  seedLogger.info('Default commodities seeded');
};
