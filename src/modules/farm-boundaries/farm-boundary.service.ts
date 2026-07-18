import { inject, injectable } from 'tsyringe';

import { FarmRepository } from '@/modules/farms/farm.repository';
import { NominatimClient } from '@/shared/integrations/nominatim.client';
import { BadRequestError, NotFoundError } from '@/shared/errors';
import {
  calculatePolygonAreaHectares,
  normalizeBoundaryPlots,
  polygonCentroid,
} from '@/shared/utils/polygon.util';

import {
  IFarmBoundaryOutput,
  IFarmBoundaryRecord,
  IFarmGeocodeOutput,
  IDeleteFarmBoundaryOutput,
  IGetFarmBoundaryOutput,
  IUpsertFarmBoundaryInput,
} from './farm-boundary.interface';
import { FarmBoundaryRepository } from './farm-boundary.repository';
import { FarmAssessmentRepository } from '@/modules/farm-assessments/farm-assessment.repository';

const mapBoundaryToOutput = (record: IFarmBoundaryRecord): IFarmBoundaryOutput => ({
  farmId: record.farmId,
  coordinates: record.coordinates,
  plots: record.plots,
  areaHectares: record.areaHectares,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

/**
 * FarmBoundaryService implements farm boundary CRUD and geocoding.
 */
@injectable()
export class FarmBoundaryService {
  constructor(
    @inject(FarmBoundaryRepository)
    private readonly farmBoundaryRepository: FarmBoundaryRepository,
    @inject(FarmRepository) private readonly farmRepository: FarmRepository,
    @inject(FarmAssessmentRepository)
    private readonly farmAssessmentRepository: FarmAssessmentRepository,
    @inject(NominatimClient) private readonly nominatimClient: NominatimClient,
  ) {}

  /** Returns saved boundary for a farm. */
  async getBoundary(farmId: string): Promise<IGetFarmBoundaryOutput> {
    await this.assertFarmExists(farmId);

    const record = await this.farmBoundaryRepository.findByFarmId(farmId);

    return {
      boundary: record ? mapBoundaryToOutput(record) : null,
    };
  }

  /** Saves or replaces a farm boundary (single or multi-plot). */
  async upsertBoundary(
    farmId: string,
    input: IUpsertFarmBoundaryInput,
  ): Promise<IFarmBoundaryOutput> {
    const farm = await this.farmRepository.findById(farmId);

    if (!farm) {
      throw new NotFoundError('Farm not found');
    }

    const plots = normalizeBoundaryPlots(input.coordinates ?? [], input.plots);

    if (plots.length === 0) {
      throw new BadRequestError('Provide coordinates or plots for the farm boundary');
    }

    const areaHectares = calculatePolygonAreaHectares(plots);
    const existing = await this.farmBoundaryRepository.findByFarmId(farmId);

    const record = await this.farmBoundaryRepository.upsert({
      farmId,
      plots,
      areaHectares,
    });

    const centroid = polygonCentroid(plots);
    const nextStatus =
      !existing && farm.status === 'DRAFT' ? ('MAPPED' as const) : farm.status;

    await this.farmRepository.updateById(farmId, {
      areaHectares,
      status: nextStatus,
      location: {
        country: farm.country,
        region: farm.region,
        city: farm.city,
        latitude: farm.latitude ?? centroid.latitude,
        longitude: farm.longitude ?? centroid.longitude,
      },
    });

    return mapBoundaryToOutput(record);
  }

  /** Deletes a farm boundary when no assessments exist. */
  async deleteBoundary(farmId: string): Promise<IDeleteFarmBoundaryOutput> {
    const farm = await this.farmRepository.findById(farmId);

    if (!farm) {
      throw new NotFoundError('Farm not found');
    }

    const existing = await this.farmBoundaryRepository.findByFarmId(farmId);

    if (!existing) {
      throw new NotFoundError('Farm boundary not found');
    }

    const assessmentCount = await this.farmAssessmentRepository.countByFarmId(farmId);

    if (assessmentCount > 0) {
      throw new BadRequestError('Cannot delete boundary while assessments exist');
    }

    const deleted = await this.farmBoundaryRepository.deleteByFarmId(farmId);

    if (!deleted) {
      throw new NotFoundError('Farm boundary not found');
    }

    const nextStatus = farm.status === 'MAPPED' ? ('DRAFT' as const) : farm.status;

    await this.farmRepository.updateById(farmId, {
      areaHectares: null,
      status: nextStatus,
    });

    return { success: true, farmId };
  }

  /** Geocodes a farm address for map centering and persists coordinates. */
  async geocodeFarm(farmId: string): Promise<IFarmGeocodeOutput> {
    const farm = await this.farmRepository.findById(farmId);

    if (!farm) {
      throw new NotFoundError('Farm not found');
    }

    if (farm.latitude !== null && farm.longitude !== null) {
      return {
        latitude: farm.latitude,
        longitude: farm.longitude,
        displayName: `${farm.city}, ${farm.region}, ${farm.country}`,
      };
    }

    const result = await this.nominatimClient.geocodeFarmAddress({
      city: farm.city,
      region: farm.region,
      country: farm.country || 'Nigeria',
    });

    if (!result) {
      throw new NotFoundError('Could not geocode farm address');
    }

    await this.farmRepository.updateById(farmId, {
      location: {
        country: farm.country,
        region: farm.region,
        city: farm.city,
        latitude: result.latitude,
        longitude: result.longitude,
      },
    });

    return result;
  }

  private async assertFarmExists(farmId: string): Promise<void> {
    const farm = await this.farmRepository.findById(farmId);

    if (!farm) {
      throw new NotFoundError('Farm not found');
    }
  }
}
