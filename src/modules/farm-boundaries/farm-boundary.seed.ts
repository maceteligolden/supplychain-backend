import { prismaClient } from '@/shared/database';
import { calculatePolygonAreaHectares } from '@/shared/utils/polygon.util';
import { createChildLogger } from '@/shared/utils';

const seedLogger = createChildLogger('seed:farm-boundaries');

const ASHANTI_BOUNDARY_COORDINATES = [
  { latitude: 6.6895, longitude: -1.6254 },
  { latitude: 6.6895, longitude: -1.6234 },
  { latitude: 6.6875, longitude: -1.6234 },
  { latitude: 6.6875, longitude: -1.6254 },
];

/** Seeds demo farm boundary on Ashanti Cocoa Farm when none exists. */
export const seedFarmBoundariesIfEmpty = async (): Promise<void> => {
  const count = await prismaClient.farmBoundary.count();

  if (count > 0) {
    return;
  }

  const farm = await prismaClient.farm.findUnique({
    where: { code: 'ASHANTI_COCOA_FARM' },
  });

  if (!farm) {
    seedLogger.warn('Ashanti Cocoa Farm not found — skipping boundary seed');
    return;
  }

  const areaHectares = calculatePolygonAreaHectares(ASHANTI_BOUNDARY_COORDINATES);

  await prismaClient.farmBoundary.create({
    data: {
      farmId: farm.id,
      coordinates: ASHANTI_BOUNDARY_COORDINATES,
      areaHectares,
    },
  });

  await prismaClient.farm.update({
    where: { id: farm.id },
    data: {
      areaHectares,
      status: 'MAPPED',
    },
  });

  seedLogger.info('Ashanti Cocoa Farm boundary seeded');
};
