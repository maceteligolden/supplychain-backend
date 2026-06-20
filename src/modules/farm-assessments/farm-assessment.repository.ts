import { injectable } from 'tsyringe';

import { prismaClient } from '@/shared/database';

import {
  IFarmAssessmentAnalysis,
  IFarmAssessmentProviderMetadata,
  IFarmAssessmentRecord,
  IFarmAssessmentSummary,
  IFarmLandCoverPointOutput,
} from './farm-assessment.interface';

function parseAnalysis(value: unknown): IFarmAssessmentAnalysis | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as IFarmAssessmentAnalysis;
}

function parseProviderMetadata(value: unknown): IFarmAssessmentProviderMetadata | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value;
}

/**
 * FarmAssessmentRepository handles PostgreSQL persistence for assessments and land cover.
 */
@injectable()
export class FarmAssessmentRepository {
  /** Lists assessments for a farm, newest first. */
  async findByFarmId(farmId: string): Promise<IFarmAssessmentRecord[]> {
    const rows = await prismaClient.farmAssessment.findMany({
      where: { farmId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.mapRecord(row));
  }

  /** Finds assessment by id scoped to farm. */
  async findByIdForFarm(
    farmId: string,
    assessmentId: string,
  ): Promise<IFarmAssessmentRecord | null> {
    const row = await prismaClient.farmAssessment.findFirst({
      where: { id: assessmentId, farmId },
    });

    return row ? this.mapRecord(row) : null;
  }

  /** Returns latest completed assessment per farm id. */
  async getLatestByFarmIds(
    farmIds: string[],
  ): Promise<Map<string, IFarmAssessmentSummary>> {
    if (farmIds.length === 0) {
      return new Map();
    }

    const rows = await prismaClient.farmAssessment.findMany({
      where: {
        farmId: { in: farmIds },
        status: 'COMPLETE',
        riskLevel: { not: null },
      },
      orderBy: { assessedAt: 'desc' },
    });

    const map = new Map<string, IFarmAssessmentSummary>();

    for (const row of rows) {
      if (map.has(row.farmId) || !row.riskLevel || !row.analysis || !row.assessedAt) {
        continue;
      }

      map.set(row.farmId, {
        id: row.id,
        farmId: row.farmId,
        riskLevel: row.riskLevel,
        analysis: parseAnalysis(row.analysis)!,
        assessedAt: row.assessedAt.toISOString(),
        boundaryAreaHectares: row.boundaryAreaHectares ?? 0,
        createdAt: row.createdAt.toISOString(),
      });
    }

    return map;
  }

  /** Counts assessments for a farm. */
  async countByFarmId(farmId: string): Promise<number> {
    return prismaClient.farmAssessment.count({ where: { farmId } });
  }

  /** Creates a pending assessment row. */
  async createPending(farmId: string): Promise<IFarmAssessmentRecord> {
    const row = await prismaClient.farmAssessment.create({
      data: { farmId, status: 'PENDING' },
    });

    return this.mapRecord(row);
  }

  /** Marks assessment as running. */
  async markRunning(id: string): Promise<void> {
    await prismaClient.farmAssessment.update({
      where: { id },
      data: { status: 'RUNNING' },
    });
  }

  /** Completes assessment with metrics. */
  async markComplete(input: {
    id: string;
    farmId: string;
    riskLevel: IFarmAssessmentRecord['riskLevel'];
    analysis: IFarmAssessmentAnalysis;
    boundaryAreaHectares: number;
    source: IFarmAssessmentRecord['source'];
    providerMetadata?: IFarmAssessmentProviderMetadata;
  }): Promise<IFarmAssessmentRecord> {
    const assessedAt = new Date();

    const row = await prismaClient.farmAssessment.update({
      where: { id: input.id },
      data: {
        status: 'COMPLETE',
        riskLevel: input.riskLevel,
        analysis: input.analysis,
        assessedAt,
        boundaryAreaHectares: input.boundaryAreaHectares,
        source: input.source,
        providerMetadata: (input.providerMetadata ?? undefined) as
          | import('@prisma/client').Prisma.InputJsonValue
          | undefined,
        errorMessage: null,
      },
    });

    return this.mapRecord(row);
  }

  /** Marks assessment failed. */
  async markFailed(id: string, errorMessage: string): Promise<IFarmAssessmentRecord> {
    const row = await prismaClient.farmAssessment.update({
      where: { id },
      data: { status: 'FAILED', errorMessage },
    });

    return this.mapRecord(row);
  }

  /** Returns pending/running assessments for worker processing. */
  async findPending(limit = 5): Promise<IFarmAssessmentRecord[]> {
    const rows = await prismaClient.farmAssessment.findMany({
      where: { status: { in: ['PENDING', 'RUNNING'] } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return rows.map((row) => this.mapRecord(row));
  }

  /** Replaces baseline land-cover points and inserts assessment point. */
  async replaceLandCoverPoints(input: {
    farmId: string;
    baseline: IFarmLandCoverPointOutput[];
    assessmentPoint: IFarmLandCoverPointOutput;
  }): Promise<void> {
    await prismaClient.$transaction(async (tx) => {
      await tx.farmLandCoverPoint.deleteMany({
        where: { farmId: input.farmId, source: 'BASELINE' },
      });

      if (input.baseline.length > 0) {
        await tx.farmLandCoverPoint.createMany({
          data: input.baseline.map((point) => ({
            farmId: input.farmId,
            observedAt: new Date(point.observedAt),
            forestCoverPercent: point.forestCoverPercent,
            deforestationPercent: point.deforestationPercent,
            source: 'BASELINE',
          })),
        });
      }

      await tx.farmLandCoverPoint.create({
        data: {
          farmId: input.farmId,
          observedAt: new Date(input.assessmentPoint.observedAt),
          forestCoverPercent: input.assessmentPoint.forestCoverPercent,
          deforestationPercent: input.assessmentPoint.deforestationPercent,
          source: 'ASSESSMENT',
          assessmentId: input.assessmentPoint.assessmentId,
        },
      });
    });
  }

  /** Returns land-cover timeline points for a farm. */
  async findLandCoverTimeline(farmId: string): Promise<IFarmLandCoverPointOutput[]> {
    const rows = await prismaClient.farmLandCoverPoint.findMany({
      where: { farmId },
      orderBy: { observedAt: 'asc' },
    });

    return rows.map((row) => ({
      observedAt: row.observedAt.toISOString(),
      forestCoverPercent: row.forestCoverPercent,
      deforestationPercent: row.deforestationPercent,
      source: row.source,
      assessmentId: row.assessmentId ?? undefined,
    }));
  }

  private mapRecord(row: {
    id: string;
    farmId: string;
    riskLevel: IFarmAssessmentRecord['riskLevel'];
    analysis: unknown;
    assessedAt: Date | null;
    boundaryAreaHectares: number | null;
    status: IFarmAssessmentRecord['status'];
    errorMessage: string | null;
    source: IFarmAssessmentRecord['source'];
    providerMetadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): IFarmAssessmentRecord {
    return {
      id: row.id,
      farmId: row.farmId,
      riskLevel: row.riskLevel,
      analysis: parseAnalysis(row.analysis),
      assessedAt: row.assessedAt,
      boundaryAreaHectares: row.boundaryAreaHectares,
      status: row.status,
      errorMessage: row.errorMessage,
      source: row.source,
      providerMetadata: parseProviderMetadata(row.providerMetadata),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
