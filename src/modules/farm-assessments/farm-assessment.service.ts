import { inject, injectable } from 'tsyringe';

import { FarmBoundaryRepository } from '@/modules/farm-boundaries/farm-boundary.repository';
import { FarmRepository } from '@/modules/farms/farm.repository';
import { ENV } from '@/shared/constants';
import { BadRequestError, NotFoundError } from '@/shared/errors';

import { AssessmentEngineService } from './assessment-engine.service';
import { buildAssessmentMapContext } from './assessment-map-context.util';
import { calculatePolygonAreaHectares } from '@/shared/utils/polygon.util';
import {
  IFarmAssessmentMapContext,
  IFarmAssessmentOutput,
  IFarmAssessmentRecord,
  IGetFarmAssessmentsOutput,
  IGetFarmLandCoverTimelineOutput,
} from './farm-assessment.interface';
import { FarmAssessmentRepository } from './farm-assessment.repository';

const mapAssessmentToOutput = (
  record: IFarmAssessmentRecord,
): IFarmAssessmentOutput => ({
  id: record.id,
  farmId: record.farmId,
  riskLevel: record.riskLevel,
  analysis: record.analysis,
  assessedAt: record.assessedAt?.toISOString() ?? null,
  boundaryAreaHectares: record.boundaryAreaHectares,
  status: record.status,
  errorMessage: record.errorMessage ?? undefined,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

/**
 * FarmAssessmentService implements assessment listing, execution, and land-cover reads.
 */
@injectable()
export class FarmAssessmentService {
  constructor(
    @inject(FarmAssessmentRepository)
    private readonly farmAssessmentRepository: FarmAssessmentRepository,
    @inject(FarmBoundaryRepository)
    private readonly farmBoundaryRepository: FarmBoundaryRepository,
    @inject(FarmRepository) private readonly farmRepository: FarmRepository,
    @inject(AssessmentEngineService)
    private readonly assessmentEngineService: AssessmentEngineService,
  ) {}

  /** Lists assessments for a farm. */
  async listAssessments(farmId: string): Promise<IGetFarmAssessmentsOutput> {
    await this.assertFarmExists(farmId);

    const records = await this.farmAssessmentRepository.findByFarmId(farmId);

    return {
      assessments: records.map(mapAssessmentToOutput),
      total: records.length,
    };
  }

  /** Returns a single assessment. */
  async getAssessmentById(
    farmId: string,
    assessmentId: string,
  ): Promise<IFarmAssessmentOutput> {
    await this.assertFarmExists(farmId);

    const record = await this.farmAssessmentRepository.findByIdForFarm(
      farmId,
      assessmentId,
    );

    if (!record) {
      throw new NotFoundError('Farm assessment not found');
    }

    return mapAssessmentToOutput(record);
  }

  /** Starts an assessment synchronously with timeout fallback to async worker. */
  async runAssessment(farmId: string): Promise<{
    assessment: IFarmAssessmentOutput;
    asyncAccepted: boolean;
  }> {
    await this.assertFarmExists(farmId);

    const boundary = await this.farmBoundaryRepository.findByFarmId(farmId);

    if (!boundary) {
      throw new BadRequestError(
        'Farm boundary is required before running an assessment',
        {
          issues: [
            { path: 'boundary', message: 'Draw and save a farm boundary first' },
          ],
        },
      );
    }

    const pending = await this.farmAssessmentRepository.createPending(farmId);

    try {
      await Promise.race([
        this.assessmentEngineService.executeAssessment(pending.id, farmId),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('ASSESSMENT_TIMEOUT'));
          }, ENV.ASSESSMENT_SYNC_TIMEOUT_MS);
        }),
      ]);

      const completed = await this.farmAssessmentRepository.findByIdForFarm(
        farmId,
        pending.id,
      );

      if (!completed) {
        throw new NotFoundError('Farm assessment not found');
      }

      return { assessment: mapAssessmentToOutput(completed), asyncAccepted: false };
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'ASSESSMENT_TIMEOUT') {
        const failed = await this.farmAssessmentRepository.findByIdForFarm(
          farmId,
          pending.id,
        );

        if (failed?.status === 'FAILED') {
          throw new BadRequestError(failed.errorMessage ?? 'Assessment failed');
        }

        throw error;
      }

      const queued = await this.farmAssessmentRepository.findByIdForFarm(
        farmId,
        pending.id,
      );

      if (!queued) {
        throw new NotFoundError('Farm assessment not found');
      }

      return { assessment: mapAssessmentToOutput(queued), asyncAccepted: true };
    }
  }

  /** Returns land-cover timeline points for a farm. */
  async getLandCoverTimeline(farmId: string): Promise<IGetFarmLandCoverTimelineOutput> {
    await this.assertFarmExists(farmId);

    const points = await this.farmAssessmentRepository.findLandCoverTimeline(farmId);

    return { points };
  }

  /** Returns map overlay context for a completed assessment. */
  async getAssessmentMapContext(
    farmId: string,
    assessmentId: string,
  ): Promise<IFarmAssessmentMapContext> {
    await this.assertFarmExists(farmId);

    const [assessment, boundary] = await Promise.all([
      this.farmAssessmentRepository.findByIdForFarm(farmId, assessmentId),
      this.farmBoundaryRepository.findByFarmId(farmId),
    ]);

    if (!assessment) {
      throw new NotFoundError('Farm assessment not found');
    }

    if (assessment.status !== 'COMPLETE' || !assessment.analysis) {
      throw new BadRequestError(
        'Assessment map is available only for completed assessments',
      );
    }

    if (!boundary) {
      throw new BadRequestError(
        'Farm boundary is required to render the assessment map',
      );
    }

    return buildAssessmentMapContext({
      boundary: boundary.coordinates,
      boundaryAreaHectares:
        assessment.boundaryAreaHectares ??
        boundary.areaHectares ??
        calculatePolygonAreaHectares(boundary.coordinates),
      analysis: assessment.analysis,
      providerMetadata: assessment.providerMetadata,
    });
  }

  /** Processes pending assessments — used by background worker. */
  async processPendingAssessments(limit = 5): Promise<number> {
    const pending = await this.farmAssessmentRepository.findPending(limit);
    let processed = 0;

    for (const item of pending) {
      await this.assessmentEngineService.executeAssessment(item.id, item.farmId);
      processed += 1;
    }

    return processed;
  }

  private async assertFarmExists(farmId: string): Promise<void> {
    const farm = await this.farmRepository.findById(farmId);

    if (!farm) {
      throw new NotFoundError('Farm not found');
    }
  }
}
