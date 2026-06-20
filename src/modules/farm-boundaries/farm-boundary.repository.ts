import { injectable } from 'tsyringe';

import { prismaClient } from '@/shared/database';
import type { GeoCoordinate } from '@/shared/utils/polygon.util';

import { IFarmBoundaryRecord } from './farm-boundary.interface';

function parseCoordinates(value: unknown): GeoCoordinate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as GeoCoordinate[];
}

/**
 * FarmBoundaryRepository handles PostgreSQL persistence for farm boundaries.
 */
@injectable()
export class FarmBoundaryRepository {
  /** Finds boundary by farm id. */
  async findByFarmId(farmId: string): Promise<IFarmBoundaryRecord | null> {
    const record = await prismaClient.farmBoundary.findUnique({ where: { farmId } });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      farmId: record.farmId,
      coordinates: parseCoordinates(record.coordinates),
      areaHectares: record.areaHectares,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /** Upserts a farm boundary polygon. */
  async upsert(input: {
    farmId: string;
    coordinates: GeoCoordinate[];
    areaHectares: number;
  }): Promise<IFarmBoundaryRecord> {
    const record = await prismaClient.farmBoundary.upsert({
      where: { farmId: input.farmId },
      create: {
        farmId: input.farmId,
        coordinates: input.coordinates,
        areaHectares: input.areaHectares,
      },
      update: {
        coordinates: input.coordinates,
        areaHectares: input.areaHectares,
      },
    });

    return {
      id: record.id,
      farmId: record.farmId,
      coordinates: parseCoordinates(record.coordinates),
      areaHectares: record.areaHectares,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /** Deletes boundary by farm id. Returns true when removed. */
  async deleteByFarmId(farmId: string): Promise<boolean> {
    try {
      await prismaClient.farmBoundary.delete({ where: { farmId } });
      return true;
    } catch {
      return false;
    }
  }
}
