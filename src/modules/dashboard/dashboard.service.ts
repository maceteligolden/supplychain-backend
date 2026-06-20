import { inject, injectable } from 'tsyringe';

import { ActorRepository } from '@/modules/actors/actor.repository';
import { BatchAllocationRepository } from '@/modules/batch-allocations/batch-allocation.repository';
import { BatchRepository } from '@/modules/batches/batch.repository';
import { CommodityRepository } from '@/modules/commodities/commodity.repository';
import { FarmAssessmentRepository } from '@/modules/farm-assessments/farm-assessment.repository';
import { FarmRepository } from '@/modules/farms/farm.repository';
import { SupplyChainEventRepository } from '@/modules/supply-chain-events/supply-chain-event.repository';
import { SupplyChainRepository } from '@/modules/supply-chains/supply-chain.repository';

import { buildDashboardSummary } from './dashboard-summary.util';
import { IGetDashboardSummaryOutput } from './dashboard.interface';

/**
 * DashboardService aggregates traceability data into a dashboard summary.
 */
@injectable()
export class DashboardService {
  constructor(
    @inject(FarmRepository) private readonly farmRepository: FarmRepository,
    @inject(FarmAssessmentRepository)
    private readonly farmAssessmentRepository: FarmAssessmentRepository,
    @inject(BatchRepository) private readonly batchRepository: BatchRepository,
    @inject(SupplyChainRepository)
    private readonly supplyChainRepository: SupplyChainRepository,
    @inject(SupplyChainEventRepository)
    private readonly supplyChainEventRepository: SupplyChainEventRepository,
    @inject(BatchAllocationRepository)
    private readonly batchAllocationRepository: BatchAllocationRepository,
    @inject(CommodityRepository)
    private readonly commodityRepository: CommodityRepository,
    @inject(ActorRepository) private readonly actorRepository: ActorRepository,
  ) {}

  /** Loads domain data and builds the dashboard summary. */
  async getSummary(): Promise<IGetDashboardSummaryOutput> {
    const [
      farmsCount,
      batchesCount,
      supplyChains,
      events,
      commodities,
      actors,
      allocations,
      batches,
      farms,
    ] = await Promise.all([
      this.farmRepository.countAll(),
      this.batchRepository.countAll(),
      this.supplyChainRepository.findAll(),
      this.supplyChainEventRepository.findAll(),
      this.commodityRepository.findAll(),
      this.actorRepository.findAll(),
      this.batchAllocationRepository.findAll(),
      this.batchRepository.findAll(),
      this.farmRepository.findAll(),
    ]);

    const farmIds = farms.map((farm) => farm.id);
    const latestAssessmentRecords =
      await this.farmAssessmentRepository.getLatestByFarmIds(farmIds);

    const latestAssessmentByFarmId = new Map(
      [...latestAssessmentRecords.entries()].map(([farmId, summary]) => [
        farmId,
        {
          riskLevel: summary.riskLevel,
          assessedAt: summary.assessedAt,
          analysis: null,
        },
      ]),
    );

    return buildDashboardSummary({
      farmsCount,
      batchesCount,
      supplyChains,
      events,
      commodities,
      actors,
      allocations,
      batches,
      farms,
      latestAssessmentByFarmId,
    });
  }
}
