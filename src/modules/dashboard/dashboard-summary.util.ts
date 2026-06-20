import {
  AssessmentRiskLevel,
  getSupplyChainEventTypeOrder,
  maxAssessmentRiskLevel,
  SUPPLY_CHAIN_EVENT_TYPES,
  SUPPLY_CHAIN_EVENT_TYPE_LABELS,
  SupplyChainEventType,
  SupplyChainOverallRiskLevel,
} from '@/shared/constants';

import { IActorRecord } from '@/modules/actors/actor.interface';
import { IAllocationRecord } from '@/modules/batch-allocations/batch-allocation.interface';
import { IBatchRecord } from '@/modules/batches/batch.interface';
import { ICommodityRecord } from '@/modules/commodities/commodity.interface';
import { IFarmRecord } from '@/modules/farms/farm.interface';
import { ISupplyChainEventRecord } from '@/modules/supply-chain-events/supply-chain-event.interface';
import { ISupplyChainRecord } from '@/modules/supply-chains/supply-chain.interface';

import {
  IDashboardChartPoint,
  IDashboardKpi,
  IDashboardRecentActivity,
  IDashboardSummary,
  IOngoingSupplyChain,
} from './dashboard.interface';

const ONGOING_CHAIN_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 5;

export interface IFarmAssessmentSummary {
  riskLevel: AssessmentRiskLevel;
  assessedAt: string;
  analysis?: string | null;
}

export type BuildDashboardSummaryInput = {
  farmsCount: number;
  batchesCount: number;
  supplyChains: ISupplyChainRecord[];
  events: ISupplyChainEventRecord[];
  commodities: ICommodityRecord[];
  actors: IActorRecord[];
  allocations: IAllocationRecord[];
  batches: IBatchRecord[];
  farms: IFarmRecord[];
  latestAssessmentByFarmId: Map<string, IFarmAssessmentSummary | undefined>;
};

export type BuildSupplyChainRiskSummaryInput = {
  supplyChainId: string;
  allocations: IAllocationRecord[];
  batches: IBatchRecord[];
  farms: IFarmRecord[];
  latestAssessmentByFarmId: Map<string, IFarmAssessmentSummary | undefined>;
};

type SupplyChainFarmRiskEntry = {
  farmId: string;
  farmName: string;
  riskLevel: AssessmentRiskLevel | null;
  latestAssessedAt?: string;
  analysis?: string | null;
  allocatedQuantity: number;
  unit?: string;
};

function buildFarmRiskEntries(
  input: BuildSupplyChainRiskSummaryInput,
): SupplyChainFarmRiskEntry[] {
  const chainAllocations = input.allocations.filter(
    (item) => item.supplyChainId === input.supplyChainId,
  );

  const quantityByFarmId = new Map<string, { quantity: number; unit?: string }>();

  for (const allocation of chainAllocations) {
    const batch = input.batches.find((item) => item.id === allocation.batchId);
    if (!batch) {
      continue;
    }

    const existing = quantityByFarmId.get(batch.farmId);
    quantityByFarmId.set(batch.farmId, {
      quantity: (existing?.quantity ?? 0) + allocation.quantity,
      unit: batch.unit,
    });
  }

  return Array.from(quantityByFarmId.entries())
    .map(([farmId, totals]) => {
      const farm = input.farms.find((item) => item.id === farmId);
      const assessment = input.latestAssessmentByFarmId.get(farmId);

      return {
        farmId,
        farmName: farm?.name ?? 'Unknown farm',
        riskLevel: assessment?.riskLevel ?? null,
        latestAssessedAt: assessment?.assessedAt,
        analysis: assessment?.analysis ?? null,
        allocatedQuantity: totals.quantity,
        unit: totals.unit,
      };
    })
    .sort((a, b) => a.farmName.localeCompare(b.farmName));
}

function deriveOverallRiskLevel(input: {
  farmRisks: SupplyChainFarmRiskEntry[];
}): SupplyChainOverallRiskLevel {
  if (input.farmRisks.length === 0) {
    return 'NO_FARMS';
  }

  const assessedLevels = input.farmRisks
    .map((entry) => entry.riskLevel)
    .filter((level): level is AssessmentRiskLevel => level !== null);

  if (assessedLevels.length === 0) {
    return 'UNASSESSED';
  }

  return maxAssessmentRiskLevel(assessedLevels) ?? 'UNASSESSED';
}

/** Builds deforestation risk summary for a supply chain from allocations and farm assessments. */
export function buildSupplyChainRiskSummary(input: BuildSupplyChainRiskSummaryInput): {
  supplyChainId: string;
  overallRiskLevel: SupplyChainOverallRiskLevel;
} {
  const farmRisks = buildFarmRiskEntries(input);

  return {
    supplyChainId: input.supplyChainId,
    overallRiskLevel: deriveOverallRiskLevel({ farmRisks }),
  };
}

function getChainOverallRiskLevel(
  input: BuildDashboardSummaryInput,
  supplyChainId: string,
): SupplyChainOverallRiskLevel {
  return buildSupplyChainRiskSummary({
    supplyChainId,
    allocations: input.allocations,
    batches: input.batches,
    farms: input.farms,
    latestAssessmentByFarmId: input.latestAssessmentByFarmId,
  }).overallRiskLevel;
}

function countAtRiskChains(input: BuildDashboardSummaryInput): number {
  return input.supplyChains.filter((chain) => {
    const risk = getChainOverallRiskLevel(input, chain.id);
    return risk === 'HIGH' || risk === 'MEDIUM';
  }).length;
}

function getFurthestEventType(
  chainEvents: ISupplyChainEventRecord[],
): SupplyChainEventType | null {
  if (chainEvents.length === 0) {
    return null;
  }

  return chainEvents.reduce<SupplyChainEventType | null>((furthest, event) => {
    if (!furthest) {
      return event.type;
    }

    const order = getSupplyChainEventTypeOrder(event.type);
    const furthestOrder = getSupplyChainEventTypeOrder(furthest);
    return order > furthestOrder ? event.type : furthest;
  }, null);
}

function getProgressLabel(furthestType: SupplyChainEventType | null): string {
  if (!furthestType) {
    return 'Not started';
  }

  return `At ${SUPPLY_CHAIN_EVENT_TYPE_LABELS[furthestType].replace(' at farm', '').replace(' / aggregated', '')}`;
}

function isChainOngoing(
  chain: ISupplyChainRecord,
  chainEvents: ISupplyChainEventRecord[],
): boolean {
  if (chain.status !== 'ACTIVE') {
    return false;
  }

  const furthest = getFurthestEventType(chainEvents);
  return furthest !== 'DELIVERED';
}

function buildKpis(input: BuildDashboardSummaryInput): IDashboardKpi[] {
  const activeSupplyChainsCount = input.supplyChains.filter(
    (chain) => chain.status === 'ACTIVE',
  ).length;

  return [
    {
      id: 'kpi-farms',
      label: 'Farms',
      value: input.farmsCount,
      description: 'Registered farms',
    },
    {
      id: 'kpi-batches',
      label: 'Batches',
      value: input.batchesCount,
      description: 'Harvest batches',
    },
    {
      id: 'kpi-active-chains',
      label: 'Active supply chains',
      value: activeSupplyChainsCount,
      description: 'Journeys in progress',
    },
    {
      id: 'kpi-events',
      label: 'Events',
      value: input.events.length,
      description: 'Recorded lifecycle events',
    },
    {
      id: 'kpi-at-risk-chains',
      label: 'At-risk chains',
      value: countAtRiskChains(input),
      description: 'Chains with medium or high farm risk',
    },
  ];
}

function buildOngoingSupplyChains(
  input: BuildDashboardSummaryInput,
): IOngoingSupplyChain[] {
  const commodityById = new Map(input.commodities.map((item) => [item.id, item.name]));

  return input.supplyChains
    .filter((chain) => {
      const chainEvents = input.events.filter(
        (event) => event.supplyChainId === chain.id,
      );
      return isChainOngoing(chain, chainEvents);
    })
    .map((chain) => {
      const chainEvents = input.events.filter(
        (event) => event.supplyChainId === chain.id,
      );
      const furthest = getFurthestEventType(chainEvents);
      const commodityName =
        commodityById.get(chain.commodityId ?? '') ?? 'Unknown commodity';

      return {
        supplyChainId: chain.id,
        name: chain.name,
        commodityName,
        progressLabel: getProgressLabel(furthest),
        eventsRecordedCount: chainEvents.length,
        overallRiskLevel: getChainOverallRiskLevel(input, chain.id),
      };
    })
    .slice(0, ONGOING_CHAIN_LIMIT);
}

function buildEventsByType(events: ISupplyChainEventRecord[]): IDashboardChartPoint[] {
  const counts = new Map<SupplyChainEventType, number>();

  for (const type of SUPPLY_CHAIN_EVENT_TYPES) {
    counts.set(type, 0);
  }

  for (const event of events) {
    counts.set(event.type, (counts.get(event.type) ?? 0) + 1);
  }

  return SUPPLY_CHAIN_EVENT_TYPES.map((type) => ({
    label: SUPPLY_CHAIN_EVENT_TYPE_LABELS[type],
    value: counts.get(type) ?? 0,
  }));
}

function buildChainProgress(input: BuildDashboardSummaryInput): IDashboardChartPoint[] {
  const buckets = new Map<string, number>();

  for (const chain of input.supplyChains.filter((item) => item.status === 'ACTIVE')) {
    const chainEvents = input.events.filter(
      (event) => event.supplyChainId === chain.id,
    );
    const furthest = getFurthestEventType(chainEvents);
    const label = furthest ? SUPPLY_CHAIN_EVENT_TYPE_LABELS[furthest] : 'Not started';
    buckets.set(label, (buckets.get(label) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
}

function toIsoTimestamp(value: Date): string {
  return value.toISOString();
}

function buildRecentActivity(
  input: BuildDashboardSummaryInput,
): IDashboardRecentActivity[] {
  const chainById = new Map(input.supplyChains.map((item) => [item.id, item]));
  const actorById = new Map(input.actors.map((item) => [item.id, item]));

  return [...input.events]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT)
    .map((event) => {
      const chain = chainById.get(event.supplyChainId);
      const actor = actorById.get(event.actorId);
      const eventLabel = SUPPLY_CHAIN_EVENT_TYPE_LABELS[event.type];
      const chainName = chain?.name ?? 'Unknown chain';
      const actorName = actor?.name ?? 'Unknown actor';

      return {
        id: event.id,
        description: `${eventLabel} on ${chainName} at ${actorName}`,
        occurredAt: toIsoTimestamp(event.occurredAt),
        supplyChainId: event.supplyChainId,
      };
    });
}

/** Builds the dashboard summary from traceability domain data. */
export function buildDashboardSummary(
  input: BuildDashboardSummaryInput,
): IDashboardSummary {
  return {
    kpis: buildKpis(input),
    ongoingSupplyChains: buildOngoingSupplyChains(input),
    eventsByType: buildEventsByType(input.events),
    chainProgress: buildChainProgress(input),
    recentActivity: buildRecentActivity(input),
  };
}
