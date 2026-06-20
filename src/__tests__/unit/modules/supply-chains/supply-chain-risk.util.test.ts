import { describe, expect, it } from 'vitest';

import { buildSupplyChainRiskSummary } from '@/modules/supply-chains/supply-chain-risk.util';

const now = new Date('2025-01-01T00:00:00.000Z');

describe('buildSupplyChainRiskSummary', () => {
  it('returns NO_FARMS when chain has no allocations', () => {
    const summary = buildSupplyChainRiskSummary({
      supplyChainId: 'chain-1',
      allocations: [],
      batches: [],
      farms: [],
      latestAssessmentByFarmId: new Map(),
    });

    expect(summary.overallRiskLevel).toBe('NO_FARMS');
    expect(summary.linkedFarmsCount).toBe(0);
  });

  it('returns UNASSESSED when farms are linked but not assessed', () => {
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
          batchNumber: 'BATCH_TEST_001',
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
          name: 'Test Farm',
          code: 'TEST_FARM',
          status: 'DRAFT',
          ownerFirstName: 'A',
          ownerLastName: 'B',
          ownerPhone: '',
          ownerEmail: '',
          country: 'Ghana',
          region: 'Ashanti',
          city: 'Kumasi',
          latitude: null,
          longitude: null,
          annualProductionEstimateKg: null,
          areaHectares: null,
          declarationAccepted: true,
          commodityIds: ['commodity-1'],
          createdAt: now,
          updatedAt: now,
        },
      ],
      latestAssessmentByFarmId: new Map(),
    });

    expect(summary.overallRiskLevel).toBe('UNASSESSED');
    expect(summary.unassessedFarmsCount).toBe(1);
  });
});
