import {
  ASSESSMENT_RISK_LABELS,
  SUPPLY_CHAIN_EVENT_TYPE_LABELS,
  SUPPLY_CHAIN_OVERALL_RISK_LABELS,
  SUPPLY_CHAIN_STATUS_LABELS,
  formatActorAddress,
} from '@/shared/constants/supply-chain-labels.constants';

import { IAllocationRecord } from '@/modules/batch-allocations/batch-allocation.interface';
import { IBatchRecord } from '@/modules/batches/batch.interface';
import { ICommodityRecord } from '@/modules/commodities/commodity.interface';
import { IFarmRecord } from '@/modules/farms/farm.interface';
import { IActorRecord } from '@/modules/actors/actor.interface';
import { ISupplyChainEventRecord } from '@/modules/supply-chain-events/supply-chain-event.interface';

import { buildSupplyChainRiskSummary } from './supply-chain-risk.util';
import {
  IFarmAssessment,
  ISupplyChainRecord,
  ISupplyChainReportOutput,
  ISupplyChainStats,
} from './supply-chain.interface';

export type BuildSupplyChainReportInput = {
  supplyChain: ISupplyChainRecord;
  commodity?: ICommodityRecord;
  allocations: IAllocationRecord[];
  batches: IBatchRecord[];
  farms: IFarmRecord[];
  events: ISupplyChainEventRecord[];
  actors: IActorRecord[];
  latestAssessmentByFarmId: Map<string, IFarmAssessment | undefined>;
  generatedAt?: string;
};

/** Computes summary stats for a supply chain detail page. */
export const getSupplyChainStats = (input: {
  allocations: IAllocationRecord[];
  batches: IBatchRecord[];
  farms: IFarmRecord[];
  events: ISupplyChainEventRecord[];
}): ISupplyChainStats => {
  const farmIds = new Set<string>();
  for (const allocation of input.allocations) {
    const batch = input.batches.find((item) => item.id === allocation.batchId);
    if (batch) {
      farmIds.add(batch.farmId);
    }
  }

  const totalAllocatedQuantity = input.allocations.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return {
    linkedFarmsCount: farmIds.size,
    allocatedBatchesCount: input.allocations.length,
    totalAllocatedQuantity,
    eventsRecordedCount: input.events.length,
  };
};

/** Assembles a traceability report DTO from supply chain domain data. */
export const buildSupplyChainReport = (
  input: BuildSupplyChainReportInput,
): ISupplyChainReportOutput => {
  const actorById = new Map(input.actors.map((item) => [item.id, item]));
  const batchById = new Map(input.batches.map((item) => [item.id, item]));
  const farmById = new Map(input.farms.map((item) => [item.id, item]));

  const stats = getSupplyChainStats({
    allocations: input.allocations,
    batches: input.batches,
    farms: input.farms,
    events: input.events,
  });

  const riskSummary = buildSupplyChainRiskSummary({
    supplyChainId: input.supplyChain.id,
    allocations: input.allocations,
    batches: input.batches,
    farms: input.farms,
    latestAssessmentByFarmId: input.latestAssessmentByFarmId,
  });

  const allocations = input.allocations.map((allocation) => {
    const batch = batchById.get(allocation.batchId);
    const farm = batch ? farmById.get(batch.farmId) : undefined;

    return {
      farmName: farm?.name ?? 'Unknown farm',
      batchNumber: batch?.batchNumber ?? allocation.batchId,
      quantity: allocation.quantity,
      unit: batch?.unit ?? '',
    };
  });

  const events = [...input.events]
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
    .map((event) => {
      const actor = actorById.get(event.actorId);

      return {
        typeLabel: SUPPLY_CHAIN_EVENT_TYPE_LABELS[event.type],
        occurredAt: event.occurredAt.toISOString(),
        actorName: actor?.name ?? 'Unknown actor',
        actorAddress: actor ? formatActorAddress(actor) : '',
        notes: event.notes ?? undefined,
      };
    });

  return {
    name: input.supplyChain.name,
    code: input.supplyChain.code,
    statusLabel: SUPPLY_CHAIN_STATUS_LABELS[input.supplyChain.status],
    commodityName: input.commodity?.name ?? 'Unknown commodity',
    description: input.supplyChain.description ?? undefined,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    stats,
    allocations,
    events,
    deforestation: {
      overallRiskLabel: SUPPLY_CHAIN_OVERALL_RISK_LABELS[riskSummary.overallRiskLevel],
      farms: riskSummary.farmRisks.map((entry) => ({
        farmName: entry.farmName,
        riskLabel: entry.riskLevel
          ? ASSESSMENT_RISK_LABELS[entry.riskLevel]
          : 'Not assessed',
        deforestationPercent: entry.analysis?.deforestationPercent ?? null,
        forestCoverPercent: entry.analysis?.forestCoverPercent ?? null,
        protectedAreaOverlapPercent:
          entry.analysis?.protectedAreaOverlapPercent ?? null,
        lastAssessedAt: entry.latestAssessedAt,
      })),
    },
  };
};
