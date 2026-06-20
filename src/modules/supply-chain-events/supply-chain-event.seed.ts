import { prismaClient } from '@/shared/database';
import { createChildLogger } from '@/shared/utils';

const seedLogger = createChildLogger('seed:supply-chain-events');

/** Seeds sample lifecycle events when the table is empty. */
export const seedSupplyChainEventsIfEmpty = async (): Promise<void> => {
  const count = await prismaClient.supplyChainEvent.count();

  if (count > 0) {
    return;
  }

  const [supplyChain, actor] = await Promise.all([
    prismaClient.supplyChain.findUnique({ where: { code: 'GH_COCOA_EXPORT' } }),
    prismaClient.actor.findFirst({ where: { code: 'KUMASI_COLLECTION_CENTRE' } }),
  ]);

  if (!supplyChain || !actor) {
    seedLogger.warn('Skipping supply chain event seed — chain or actor not found');
    return;
  }

  await prismaClient.supplyChainEvent.createMany({
    data: [
      {
        supplyChainId: supplyChain.id,
        type: 'HARVEST',
        occurredAt: new Date('2025-02-02T10:00:00.000Z'),
        actorId: actor.id,
        notes: 'Initial harvest recorded for cocoa export chain.',
      },
      {
        supplyChainId: supplyChain.id,
        type: 'COLLECTION',
        occurredAt: new Date('2025-02-05T14:30:00.000Z'),
        actorId: actor.id,
        notes: 'Batches aggregated for export processing.',
      },
    ],
  });

  seedLogger.info('Seeded supply chain lifecycle events');
};
