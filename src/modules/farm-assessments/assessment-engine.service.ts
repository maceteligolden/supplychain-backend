import { inject, injectable } from 'tsyringe';

import { FarmBoundaryRepository } from '@/modules/farm-boundaries/farm-boundary.repository';
import { FarmRepository } from '@/modules/farms/farm.repository';
import { GfwClient } from '@/shared/integrations/gfw.client';
import { WhispClient } from '@/shared/integrations/whisp.client';
import { coordinatesToGeoJsonPolygon } from '@/shared/utils/polygon.util';

import { deriveRiskLevel, deriveStabilityPercent } from './assessment-risk.util';
import { FarmAssessmentRepository } from './farm-assessment.repository';
import type {
  IFarmAssessmentAnalysis,
  IFarmAssessmentProviderMetadata,
  IFarmLandCoverPointOutput,
} from './farm-assessment.interface';

const PROVIDER_RETRY_ATTEMPTS = 3;

async function withRetries<T>(
  operation: () => Promise<T>,
  attempts = PROVIDER_RETRY_ATTEMPTS,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        break;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Assessment failed');
}

/**
 * AssessmentEngineService orchestrates WHISP and GFW analysis for a farm assessment job.
 * WDPA is disabled until a valid Protected Planet token is configured.
 */
@injectable()
export class AssessmentEngineService {
  constructor(
    @inject(FarmBoundaryRepository)
    private readonly farmBoundaryRepository: FarmBoundaryRepository,
    @inject(FarmRepository) private readonly farmRepository: FarmRepository,
    @inject(FarmAssessmentRepository)
    private readonly farmAssessmentRepository: FarmAssessmentRepository,
    @inject(GfwClient) private readonly gfwClient: GfwClient,
    @inject(WhispClient) private readonly whispClient: WhispClient,
  ) {}

  /** Executes a pending assessment to completion. */
  async executeAssessment(assessmentId: string, farmId: string): Promise<void> {
    await this.farmAssessmentRepository.markRunning(assessmentId);

    const boundary = await this.farmBoundaryRepository.findByFarmId(farmId);

    if (!boundary) {
      await this.farmAssessmentRepository.markFailed(
        assessmentId,
        'Farm boundary is required before running an assessment',
      );
      return;
    }

    const farm = await this.farmRepository.findById(farmId);

    if (!farm) {
      await this.farmAssessmentRepository.markFailed(assessmentId, 'Farm not found');
      return;
    }

    try {
      const plots = boundary.plots;
      const geoJson = coordinatesToGeoJsonPolygon(plots);

      const [gfw, whisp] = await withRetries(() =>
        Promise.all([
          this.gfwClient.analyzePolygon({
            farmId,
            geoJson,
            coordinates: plots[0] ?? boundary.coordinates,
          }),
          this.whispClient.analyzePolygon({
            farmId,
            geoJson,
            coordinates: plots[0] ?? boundary.coordinates,
          }),
        ]),
      );

      const deforestationPercent = whisp.lossPercent ?? gfw.deforestationPercent;
      const afforestationPercent =
        whisp.afforestationPercent ?? gfw.afforestationPercent;
      const stabilityPercent = deriveStabilityPercent(
        deforestationPercent,
        afforestationPercent,
      );

      const analysis: IFarmAssessmentAnalysis = {
        deforestationPercent,
        afforestationPercent,
        stabilityPercent,
        forestCoverPercent: Math.max(0, 100 - deforestationPercent),
        protectedAreaOverlapPercent: 0,
        protectedAreaDetected: false,
        whispRiskPcrop: whisp.whispRiskPcrop,
      };

      const providerMetadata: IFarmAssessmentProviderMetadata = {
        whisp: {
          source: whisp.source,
          rawProperties: whisp.rawProperties,
        },
        gfw: {
          geostoreId: gfw.geostoreId,
        },
      };

      const riskLevel = deriveRiskLevel(analysis);
      const assessedAt = new Date();
      const source =
        whisp.source === 'WHISP' && gfw.source !== 'FALLBACK'
          ? 'WHISP_GFW_WDPA'
          : gfw.source;

      await this.farmAssessmentRepository.markComplete({
        id: assessmentId,
        farmId,
        riskLevel,
        analysis,
        boundaryAreaHectares: boundary.areaHectares,
        source,
        providerMetadata,
      });

      const baseline: IFarmLandCoverPointOutput[] = gfw.yearlyLoss.map((point) => ({
        observedAt: `${point.year}-01-01T00:00:00.000Z`,
        forestCoverPercent: point.forestCoverPercent,
        deforestationPercent: point.deforestationPercent,
        source: 'BASELINE' as const,
      }));

      await this.farmAssessmentRepository.replaceLandCoverPoints({
        farmId,
        baseline,
        assessmentPoint: {
          observedAt: assessedAt.toISOString(),
          forestCoverPercent: analysis.forestCoverPercent,
          deforestationPercent: analysis.deforestationPercent,
          source: 'ASSESSMENT',
          assessmentId,
        },
      });

      if (['DRAFT', 'MAPPED', 'READY_FOR_ASSESSMENT'].includes(farm.status)) {
        await this.farmRepository.updateById(farmId, { status: 'ASSESSED' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Assessment failed';
      await this.farmAssessmentRepository.markFailed(assessmentId, message);
    }
  }
}
