import { describe, expect, it } from 'vitest';

import { buildDashboardSummary } from '@/modules/dashboard/dashboard-summary.util';

const now = new Date('2025-06-01T10:00:00.000Z');

describe('buildDashboardSummary', () => {
  it('aggregates KPIs and charts from domain data', () => {
    const summary = buildDashboardSummary({
      farmsCount: 2,
      batchesCount: 3,
      supplyChains: [
        {
          id: 'chain-1',
          name: 'Ghana Cocoa Export',
          code: 'GH_COCOA_EXPORT',
          description: null,
          status: 'ACTIVE',
          commodityId: 'commodity-1',
          createdAt: now,
          updatedAt: now,
        },
      ],
      events: [
        {
          id: 'event-1',
          supplyChainId: 'chain-1',
          type: 'HARVEST',
          occurredAt: now,
          actorId: 'actor-1',
          notes: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
      commodities: [
        {
          id: 'commodity-1',
          name: 'Cocoa',
          code: 'COCOA',
          unit: 'KG',
          imageUrl: '/cocoa.png',
          createdAt: now,
          updatedAt: now,
        },
      ],
      actors: [
        {
          id: 'actor-1',
          name: 'Kumasi Collection Centre',
          code: 'KUMASI_COLLECTION_CENTRE',
          type: 'COLLECTION_CENTRE',
          addressLine1: null,
          addressCity: 'Kumasi',
          addressRegion: 'Ashanti',
          addressCountry: 'Ghana',
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        },
      ],
      allocations: [],
      batches: [],
      farms: [],
      latestAssessmentByFarmId: new Map(),
    });

    expect(summary.kpis.find((kpi) => kpi.id === 'kpi-farms')?.value).toBe(2);
    expect(summary.kpis.find((kpi) => kpi.id === 'kpi-events')?.value).toBe(1);
    expect(summary.kpis.find((kpi) => kpi.id === 'kpi-at-risk-chains')?.value).toBe(0);
    expect(summary.ongoingSupplyChains).toHaveLength(1);
    expect(summary.recentActivity).toHaveLength(1);
    expect(
      summary.eventsByType.some((point) => point.label === 'Harvested at farm'),
    ).toBe(true);
  });
});
