import { prismaClient } from '@/shared/database';
import { createChildLogger } from '@/shared/utils';

const seedLogger = createChildLogger('farm-seed');

const DEFAULT_FARMS = [
  {
    name: 'Ashanti Cocoa Farm',
    code: 'ASHANTI_COCOA_FARM',
    commodityCode: 'COCOA',
    ownerFirstName: 'Kwame',
    ownerLastName: 'Mensah',
    ownerPhone: '+233241234567',
    ownerEmail: 'kwame.mensah@example.com',
    country: 'Ghana',
    region: 'Ashanti',
    city: 'Kumasi',
    latitude: 6.6885,
    longitude: -1.6244,
    annualProductionEstimateKg: 12000,
    areaHectares: 8.5,
    status: 'DRAFT' as const,
    declarationAccepted: false,
  },
  {
    name: 'Kordofan Gum Farm',
    code: 'KORDOFAN_GUM_FARM',
    commodityCode: 'GUM_ARABIC',
    ownerFirstName: 'Fatima',
    ownerLastName: 'Hassan',
    ownerPhone: '+249912345678',
    ownerEmail: 'fatima.hassan@example.com',
    country: 'Sudan',
    region: 'Kordofan',
    city: 'El Obeid',
    latitude: 13.1842,
    longitude: 30.2167,
    annualProductionEstimateKg: 4500,
    areaHectares: 15,
    status: 'DRAFT' as const,
    declarationAccepted: false,
  },
];

/**
 * Idempotently seeds default farms when the table is empty.
 */
export const seedFarmsIfEmpty = async (): Promise<void> => {
  const existingCount = await prismaClient.farm.count();

  if (existingCount > 0) {
    return;
  }

  for (const farm of DEFAULT_FARMS) {
    const commodity = await prismaClient.commodity.findUnique({
      where: { code: farm.commodityCode },
    });

    if (!commodity) {
      seedLogger.warn(
        `Commodity ${farm.commodityCode} not found — skipping ${farm.code}`,
      );
      continue;
    }

    const created = await prismaClient.farm.create({
      data: {
        name: farm.name,
        code: farm.code,
        status: farm.status,
        ownerFirstName: farm.ownerFirstName,
        ownerLastName: farm.ownerLastName,
        ownerPhone: farm.ownerPhone,
        ownerEmail: farm.ownerEmail,
        country: farm.country,
        region: farm.region,
        city: farm.city,
        latitude: farm.latitude,
        longitude: farm.longitude,
        annualProductionEstimateKg: farm.annualProductionEstimateKg,
        areaHectares: farm.areaHectares,
        declarationAccepted: farm.declarationAccepted,
      },
    });

    await prismaClient.farmCommodity.create({
      data: {
        farmId: created.id,
        commodityId: commodity.id,
      },
    });
  }

  seedLogger.info('Default farms seeded');
};
