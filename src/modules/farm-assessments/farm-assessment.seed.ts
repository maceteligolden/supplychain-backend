import { deriveRiskLevel } from '@/modules/farm-assessments/assessment-risk.util';
import { prismaClient } from '@/shared/database';
import { createChildLogger } from '@/shared/utils';

const seedLogger = createChildLogger('seed:farm-assessments');

const SEED_ASSESSMENTS = [
  {
    assessedAt: new Date('2025-02-01T10:00:00.000Z'),
    analysis: {
      deforestationPercent: 18,
      afforestationPercent: 4,
      stabilityPercent: 78,
      forestCoverPercent: 82,
      protectedAreaOverlapPercent: 6,
      protectedAreaDetected: true,
      whispRiskPcrop: 'Medium',
    },
  },
  {
    assessedAt: new Date('2025-03-15T10:00:00.000Z'),
    analysis: {
      deforestationPercent: 14,
      afforestationPercent: 3,
      stabilityPercent: 83,
      forestCoverPercent: 86,
      protectedAreaOverlapPercent: 4,
      protectedAreaDetected: true,
      whispRiskPcrop: 'Medium',
    },
  },
  {
    assessedAt: new Date('2025-04-20T10:00:00.000Z'),
    analysis: {
      deforestationPercent: 16,
      afforestationPercent: 5,
      stabilityPercent: 79,
      forestCoverPercent: 84,
      protectedAreaOverlapPercent: 7,
      protectedAreaDetected: true,
      whispRiskPcrop: 'Medium',
    },
  },
];

/** Seeds demo assessments on Ashanti Cocoa Farm when none exist. */
export const seedFarmAssessmentsIfEmpty = async (): Promise<void> => {
  const count = await prismaClient.farmAssessment.count();

  if (count > 0) {
    return;
  }

  const farm = await prismaClient.farm.findUnique({
    where: { code: 'ASHANTI_COCOA_FARM' },
    include: { boundary: true },
  });

  if (!farm?.boundary) {
    seedLogger.warn('Ashanti boundary missing — skipping assessment seed');
    return;
  }

  for (const item of SEED_ASSESSMENTS) {
    const riskLevel = deriveRiskLevel(item.analysis);
    const assessment = await prismaClient.farmAssessment.create({
      data: {
        farmId: farm.id,
        riskLevel,
        analysis: item.analysis,
        assessedAt: item.assessedAt,
        boundaryAreaHectares: farm.boundary.areaHectares,
        status: 'COMPLETE',
        source: 'FALLBACK',
        providerMetadata: {
          whisp: {
            source: 'FALLBACK',
            rawProperties: { Risk_PCrop: item.analysis.whispRiskPcrop },
          },
          wdpa: {
            source: 'FALLBACK',
            protectedAreas: { type: 'FeatureCollection', features: [] },
            nearestProtectedArea: {
              name: 'Simulated protected area',
              distanceKm: 0.5,
            },
          },
        },
      },
    });

    await prismaClient.farmLandCoverPoint.create({
      data: {
        farmId: farm.id,
        observedAt: item.assessedAt,
        forestCoverPercent: item.analysis.forestCoverPercent,
        deforestationPercent: item.analysis.deforestationPercent,
        source: 'ASSESSMENT',
        assessmentId: assessment.id,
      },
    });
  }

  const baselineYears = [2020, 2021, 2022, 2023, 2024];

  await prismaClient.farmLandCoverPoint.createMany({
    data: baselineYears.map((year, index) => ({
      farmId: farm.id,
      observedAt: new Date(`${year}-01-01T00:00:00.000Z`),
      forestCoverPercent: Math.max(70, 88 - index * 2),
      deforestationPercent: Math.min(30, 12 + index * 2),
      source: 'BASELINE' as const,
    })),
  });

  await prismaClient.farm.update({
    where: { id: farm.id },
    data: { status: 'ASSESSED' },
  });

  seedLogger.info('Ashanti Cocoa Farm assessments seeded');
};
