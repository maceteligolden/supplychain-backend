import { describe, expect, it } from 'vitest';

import { buildSupplyChainRiskSummary } from '@/modules/supply-chains/supply-chain-risk.util';
import type { IFarmAssessment } from '@/modules/supply-chains/supply-chain.interface';

const now = new Date('2025-01-01T00:00:00.000Z');

const mediumAssessment: IFarmAssessment = {
  id: 'assessment-1',
  farmId: 'farm-1',
  riskLevel: 'MEDIUM',
  analysis: {
    deforestationPercent: 16,
    afforestationPercent: 5,
    stabilityPercent: 79,
    forestCoverPercent: 84,
    protectedAreaOverlapPercent: 7,
    protectedAreaDetected: true,
  },
  assessedAt: '2025-04-20T10:00:00.000Z',
  boundaryAreaHectares: 4.91,
  createdAt: '2025-04-20T10:00:00.000Z',
};

describe('buildSupplyChainRiskSummary with assessments', () => {
  it('returns MEDIUM when linked farm has a medium assessment', () => {
    const summary = buildSupplyChainRiskSummary({
      supplyChainId: 'chain-1',
      allocations: [
        {
          id: 'alloc-1',
          batchId: 'batch-1',
          supplyChainId: 'chain-1',
          quantity: 100,
          allocatedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ],
      batches: [
        {
          id: 'batch-1',
          batchNumber: 'BATCH_ASHANTI_2025_001',
          farmId: 'farm-1',
          commodityId: 'commodity-1',
          harvestDate: '2025-01-01',
          quantity: 100,
          unit: 'KG',
          status: 'CREATED',
          createdAt: now,
          updatedAt: now,
        },
      ],
      farms: [
        {
          id: 'farm-1',
          name: 'Ashanti Cocoa Farm',
          code: 'ASHANTI_COCOA_FARM',
          status: 'ASSESSED',
          ownerFirstName: 'A',
          ownerLastName: 'B',
          ownerPhone: '',
          ownerEmail: '',
          country: 'Ghana',
          region: 'Ashanti',
          city: 'Kumasi',
          latitude: 6.6885,
          longitude: -1.6244,
          annualProductionEstimateKg: null,
          areaHectares: 4.91,
          declarationAccepted: true,
          commodityIds: ['commodity-1'],
          createdAt: now,
          updatedAt: now,
        },
      ],
      latestAssessmentByFarmId: new Map([['farm-1', mediumAssessment]]),
    });

    expect(summary.overallRiskLevel).toBe('MEDIUM');
    expect(summary.unassessedFarmsCount).toBe(0);
    expect(summary.hasPartialAssessment).toBe(false);
    expect(summary.farmRisks[0]?.riskLevel).toBe('MEDIUM');
  });
});
