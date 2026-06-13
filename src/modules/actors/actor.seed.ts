import { prismaClient } from '@/shared/database';
import { createChildLogger } from '@/shared/utils';

const seedLogger = createChildLogger('actor-seed');

const DEFAULT_ACTORS = [
  {
    name: 'Kumasi Collection Centre',
    code: 'KUMASI_COLLECTION_CENTRE',
    type: 'COLLECTION_CENTRE' as const,
    addressLine1: 'Plot 12, Industrial Area',
    addressCity: 'Kumasi',
    addressRegion: 'Ashanti',
    addressCountry: 'Ghana',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Accra Cocoa Processing Ltd',
    code: 'ACCRA_COCOA_PROCESSING_LTD',
    type: 'PROCESSOR' as const,
    addressLine1: 'Tema Industrial Zone',
    addressCity: 'Accra',
    addressRegion: 'Greater Accra',
    addressCountry: 'Ghana',
    status: 'ACTIVE' as const,
  },
  {
    name: 'Tema Export Terminal',
    code: 'TEMA_EXPORT_TERMINAL',
    type: 'EXPORTER' as const,
    addressLine1: 'Harbour Road',
    addressCity: 'Tema',
    addressRegion: 'Greater Accra',
    addressCountry: 'Ghana',
    status: 'ACTIVE' as const,
  },
];

/**
 * Idempotently seeds default actors when the table is empty.
 */
export const seedActorsIfEmpty = async (): Promise<void> => {
  const existingCount = await prismaClient.actor.count();

  if (existingCount > 0) {
    return;
  }

  for (const actor of DEFAULT_ACTORS) {
    await prismaClient.actor.create({ data: actor });
  }

  seedLogger.info('Default actors seeded');
};
