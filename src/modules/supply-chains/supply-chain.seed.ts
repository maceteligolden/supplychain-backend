import { prismaClient } from '@/shared/database';
import { createChildLogger } from '@/shared/utils';

const seedLogger = createChildLogger('supply-chain-seed');

const DEFAULT_SUPPLY_CHAINS = [
  {
    name: 'Ghana Cocoa Export Chain',
    code: 'GH_COCOA_EXPORT',
    description: 'Farm to export port — Ghana cocoa traceability route',
    status: 'ACTIVE' as const,
    commodityCode: 'COCOA',
  },
  {
    name: 'Sudan Gum Arabic Export Chain',
    code: 'SD_GUM_EXPORT',
    description: 'Farm to export port — Sudan gum arabic traceability route',
    status: 'ACTIVE' as const,
    commodityCode: 'GUM_ARABIC',
  },
];

/**
 * Idempotently seeds default supply chains when the table is empty.
 */
export const seedSupplyChainsIfEmpty = async (): Promise<void> => {
  const existingCount = await prismaClient.supplyChain.count();

  if (existingCount > 0) {
    return;
  }

  for (const chain of DEFAULT_SUPPLY_CHAINS) {
    const commodity = await prismaClient.commodity.findUnique({
      where: { code: chain.commodityCode },
    });

    if (!commodity) {
      seedLogger.warn(
        `Commodity ${chain.commodityCode} not found — skipping ${chain.code}`,
      );
      continue;
    }

    await prismaClient.supplyChain.create({
      data: {
        name: chain.name,
        code: chain.code,
        description: chain.description,
        status: chain.status,
        commodityId: commodity.id,
      },
    });
  }

  seedLogger.info('Default supply chains seeded');
};
