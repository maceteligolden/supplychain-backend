import {
  maxAssessmentRiskLevel,
  type AssessmentRiskLevel,
  type SupplyChainOverallRiskLevel,
} from '@/shared/constants/supply-chain-labels.constants';

import { IAllocationRecord } from '@/modules/batch-allocations/batch-allocation.interface';
import { IBatchRecord } from '@/modules/batches/batch.interface';
import { IFarmRecord } from '@/modules/farms/farm.interface';

import {
  IFarmAssessment,
  ISupplyChainFarmRiskEntry,
  ISupplyChainRiskSummaryOutput,
} from './supply-chain.interface';

export type BuildSupplyChainRiskSummaryInput = {
  supplyChainId: string;
  allocations: IAllocationRecord[];
  batches: IBatchRecord[];
  farms: IFarmRecord[];
  latestAssessmentByFarmId: Map<string, IFarmAssessment | undefined>;
};

function buildFarmRiskEntries(
  input: BuildSupplyChainRiskSummaryInput,
): ISupplyChainFarmRiskEntry[] {
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
  farmRisks: ISupplyChainFarmRiskEntry[];
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
export const buildSupplyChainRiskSummary = (
  input: BuildSupplyChainRiskSummaryInput,
): ISupplyChainRiskSummaryOutput => {
  const farmRisks = buildFarmRiskEntries(input);
  const assessedFarmsCount = farmRisks.filter(
    (entry) => entry.riskLevel !== null,
  ).length;
  const unassessedFarmsCount = farmRisks.length - assessedFarmsCount;

  return {
    supplyChainId: input.supplyChainId,
    overallRiskLevel: deriveOverallRiskLevel({ farmRisks }),
    linkedFarmsCount: farmRisks.length,
    assessedFarmsCount,
    unassessedFarmsCount,
    hasPartialAssessment: assessedFarmsCount > 0 && unassessedFarmsCount > 0,
    farmRisks,
  };
};
