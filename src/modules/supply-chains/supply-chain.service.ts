import { inject, injectable } from 'tsyringe';

import { IActorRecord } from '@/modules/actors/actor.interface';
import { ActorRepository } from '@/modules/actors/actor.repository';
import { IAllocationRecord } from '@/modules/batch-allocations/batch-allocation.interface';
import { BatchAllocationRepository } from '@/modules/batch-allocations/batch-allocation.repository';
import { IBatchRecord } from '@/modules/batches/batch.interface';
import { ICommodityRecord } from '@/modules/commodities/commodity.interface';
import { IFarmRecord } from '@/modules/farms/farm.interface';
import { ISupplyChainEventRecord } from '@/modules/supply-chain-events/supply-chain-event.interface';
import { BatchAllocationService } from '@/modules/batch-allocations/batch-allocation.service';
import { BatchRepository } from '@/modules/batches/batch.repository';
import { CommodityRepository } from '@/modules/commodities/commodity.repository';
import { FarmAssessmentRepository } from '@/modules/farm-assessments/farm-assessment.repository';
import { FarmRepository } from '@/modules/farms/farm.repository';
import { SupplyChainEventRepository } from '@/modules/supply-chain-events/supply-chain-event.repository';
import { prismaClient } from '@/shared/database';
import { BadRequestError, NotFoundError } from '@/shared/errors';

import { buildSupplyChainReport } from './supply-chain-report.util';
import { buildSupplyChainRiskSummary } from './supply-chain-risk.util';
import {
  ICreateSupplyChainInput,
  IDeleteSupplyChainOutput,
  IFarmAssessment,
  ISupplyChainOutput,
  ISupplyChainRecord,
  ISupplyChainReportOutput,
  ISupplyChainRiskSummaryOutput,
  ISyncSupplyChainAllocationsInput,
  ISyncSupplyChainAllocationsOutput,
  IGetSupplyChainsOutput,
  IUpdateSupplyChainInput,
} from './supply-chain.interface';
import { SupplyChainRepository } from './supply-chain.repository';

const mapSupplyChainToOutput = (record: {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: ISupplyChainOutput['status'];
  commodityId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ISupplyChainOutput => ({
  id: record.id,
  name: record.name,
  code: record.code,
  description: record.description ?? undefined,
  status: record.status,
  commodityId: record.commodityId ?? undefined,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

/**
 * SupplyChainService implements supply chain CRUD and allocation sync orchestration.
 */
@injectable()
export class SupplyChainService {
  constructor(
    @inject(SupplyChainRepository)
    private readonly supplyChainRepository: SupplyChainRepository,
    @inject(BatchAllocationService)
    private readonly batchAllocationService: BatchAllocationService,
    @inject(BatchAllocationRepository)
    private readonly batchAllocationRepository: BatchAllocationRepository,
    @inject(BatchRepository)
    private readonly batchRepository: BatchRepository,
    @inject(FarmRepository)
    private readonly farmRepository: FarmRepository,
    @inject(FarmAssessmentRepository)
    private readonly farmAssessmentRepository: FarmAssessmentRepository,
    @inject(SupplyChainEventRepository)
    private readonly supplyChainEventRepository: SupplyChainEventRepository,
    @inject(ActorRepository)
    private readonly actorRepository: ActorRepository,
    @inject(CommodityRepository)
    private readonly commodityRepository: CommodityRepository,
  ) {}

  /** Lists all supply chains with total count. */
  async listSupplyChains(): Promise<IGetSupplyChainsOutput> {
    const [records, total] = await Promise.all([
      this.supplyChainRepository.findAll(),
      this.supplyChainRepository.count(),
    ]);

    return {
      supplyChains: records.map(mapSupplyChainToOutput),
      total,
    };
  }

  /** Returns a single supply chain by id. */
  async getSupplyChainById(id: string): Promise<ISupplyChainOutput> {
    const record = await this.supplyChainRepository.findById(id);

    if (!record) {
      throw new NotFoundError('Supply chain not found');
    }

    return mapSupplyChainToOutput(record);
  }

  /** Creates a supply chain with optional inline allocations. */
  async createSupplyChain(input: ICreateSupplyChainInput): Promise<ISupplyChainOutput> {
    const code = input.code.toUpperCase();
    await this.assertCodeAvailable(code);

    if (input.commodityId) {
      await this.assertCommodityExists(input.commodityId);
    }

    const record = await this.supplyChainRepository.create({
      name: input.name,
      code,
      description: input.description,
      status: input.status,
      commodityId: input.commodityId ?? null,
    });

    if (input.allocations && input.allocations.length > 0) {
      await this.batchAllocationService.syncSupplyChainAllocations(
        record.id,
        input.allocations,
      );
    }

    const created = await this.supplyChainRepository.findById(record.id);

    if (!created) {
      throw new NotFoundError('Supply chain not found');
    }

    return mapSupplyChainToOutput(created);
  }

  /** Updates an existing supply chain. */
  async updateSupplyChain(
    id: string,
    input: IUpdateSupplyChainInput,
  ): Promise<ISupplyChainOutput> {
    const existing = await this.supplyChainRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Supply chain not found');
    }

    const nextCode = input.code ? input.code.toUpperCase() : existing.code;

    if (nextCode !== existing.code) {
      await this.assertCodeAvailable(nextCode, id);
    }

    if (input.commodityId) {
      await this.assertCommodityExists(input.commodityId);
    }

    const updated = await this.supplyChainRepository.updateById(id, {
      name: input.name,
      code: input.code ? nextCode : undefined,
      description:
        input.description !== undefined ? input.description.trim() || null : undefined,
      status: input.status,
      commodityId: input.commodityId,
    });

    if (!updated) {
      throw new NotFoundError('Supply chain not found');
    }

    return mapSupplyChainToOutput(updated);
  }

  /** Deletes a supply chain when not referenced by allocations. */
  async deleteSupplyChain(id: string): Promise<IDeleteSupplyChainOutput> {
    const existing = await this.supplyChainRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Supply chain not found');
    }

    const isReferenced = await this.supplyChainRepository.isReferencedByAllocations(id);

    if (isReferenced) {
      throw new BadRequestError(
        'Cannot delete supply chain with existing batch allocations',
      );
    }

    const deleted = await this.supplyChainRepository.deleteById(id);

    if (!deleted) {
      throw new NotFoundError('Supply chain not found');
    }

    return { success: true, id };
  }

  /** Returns deforestation risk summary for a supply chain. */
  async getRiskSummary(id: string): Promise<ISupplyChainRiskSummaryOutput> {
    const context = await this.loadSupplyChainReportContext(id);

    return buildSupplyChainRiskSummary({
      supplyChainId: id,
      allocations: context.allocations,
      batches: context.batches,
      farms: context.farms,
      latestAssessmentByFarmId: context.latestAssessmentByFarmId,
    });
  }

  /** Returns a traceability report for a supply chain. */
  async getReport(id: string): Promise<ISupplyChainReportOutput> {
    const context = await this.loadSupplyChainReportContext(id);

    return buildSupplyChainReport({
      supplyChain: context.supplyChain,
      commodity: context.commodity,
      allocations: context.allocations,
      batches: context.batches,
      farms: context.farms,
      events: context.events,
      actors: context.actors,
      latestAssessmentByFarmId: context.latestAssessmentByFarmId,
    });
  }

  /** Replaces all batch allocations for a supply chain. */
  async syncSupplyChainAllocations(
    id: string,
    input: ISyncSupplyChainAllocationsInput,
  ): Promise<ISyncSupplyChainAllocationsOutput> {
    return this.batchAllocationService.syncSupplyChainAllocations(
      id,
      input.allocations,
    );
  }

  private async loadSupplyChainReportContext(id: string): Promise<{
    supplyChain: ISupplyChainRecord;
    allocations: IAllocationRecord[];
    batches: IBatchRecord[];
    farms: IFarmRecord[];
    events: ISupplyChainEventRecord[];
    actors: IActorRecord[];
    commodity: ICommodityRecord | undefined;
    latestAssessmentByFarmId: Map<string, IFarmAssessment | undefined>;
  }> {
    const supplyChain = await this.supplyChainRepository.findById(id);

    if (!supplyChain) {
      throw new NotFoundError('Supply chain not found');
    }

    const allocations = await this.batchAllocationRepository.findBySupplyChainId(id);

    const batchIds = [...new Set(allocations.map((allocation) => allocation.batchId))];
    const batches = (
      await Promise.all(
        batchIds.map((batchId) => this.batchRepository.findById(batchId)),
      )
    ).filter((batch): batch is NonNullable<typeof batch> => batch !== null);

    const farmIds = [...new Set(batches.map((batch) => batch.farmId))];
    const farms = (
      await Promise.all(farmIds.map((farmId) => this.farmRepository.findById(farmId)))
    ).filter((farm): farm is NonNullable<typeof farm> => farm !== null);

    const events = await this.supplyChainEventRepository.findBySupplyChainId(id);

    const actorIds = [...new Set(events.map((event) => event.actorId))];
    const actors = (
      await Promise.all(
        actorIds.map((actorId) => this.actorRepository.findById(actorId)),
      )
    ).filter((actor): actor is NonNullable<typeof actor> => actor !== null);

    let commodity = supplyChain.commodityId
      ? ((await this.commodityRepository.findById(supplyChain.commodityId)) ??
        undefined)
      : undefined;

    if (!commodity && farms[0]?.commodityIds[0]) {
      commodity =
        (await this.commodityRepository.findById(farms[0].commodityIds[0])) ??
        undefined;
    }

    const latestAssessmentByFarmId =
      await this.farmAssessmentRepository.getLatestByFarmIds(farmIds);

    const latestAssessmentMap = new Map<string, IFarmAssessment | undefined>(
      [...latestAssessmentByFarmId.entries()].map(([farmId, summary]) => [
        farmId,
        summary
          ? {
              id: summary.id,
              farmId: summary.farmId,
              riskLevel: summary.riskLevel,
              analysis: summary.analysis,
              assessedAt: summary.assessedAt,
              boundaryAreaHectares: summary.boundaryAreaHectares,
              createdAt: summary.createdAt,
            }
          : undefined,
      ]),
    );

    return {
      supplyChain,
      allocations,
      batches,
      farms,
      events,
      actors,
      commodity,
      latestAssessmentByFarmId: latestAssessmentMap,
    };
  }

  private async assertCodeAvailable(code: string, excludeId?: string): Promise<void> {
    const existing = await this.supplyChainRepository.findByCode(code);

    if (existing && existing.id !== excludeId) {
      throw new BadRequestError('Supply chain code already exists', {
        issues: [{ path: 'code', message: 'Code must be unique' }],
      });
    }
  }

  private async assertCommodityExists(commodityId: string): Promise<void> {
    const commodity = await prismaClient.commodity.findUnique({
      where: { id: commodityId },
      select: { id: true },
    });

    if (!commodity) {
      throw new BadRequestError('Commodity not found', {
        issues: [{ path: 'commodityId', message: 'Commodity must exist' }],
      });
    }
  }
}
