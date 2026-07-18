import { Prisma } from '@prisma/client';
import { injectable } from 'tsyringe';

import { prismaClient } from '@/shared/database';
import {
  normalizeBoundaryPlots,
  type GeoCoordinate,
} from '@/shared/utils/polygon.util';

import { IFarmBoundaryRecord } from './farm-boundary.interface';

type StoredBoundaryCoordinates =
  | GeoCoordinate[]
  | {
      plots: GeoCoordinate[][];
    };

function isCoordinate(value: unknown): value is GeoCoordinate {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as GeoCoordinate;
  return (
    typeof candidate.latitude === 'number' && typeof candidate.longitude === 'number'
  );
}

function parseStoredCoordinates(value: unknown): {
  coordinates: GeoCoordinate[];
  plots: GeoCoordinate[][];
} {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Array.isArray((value as { plots?: unknown }).plots)
  ) {
    const plots = (value as { plots: unknown[] }).plots
      .filter((plot): plot is unknown[] => Array.isArray(plot))
      .map((plot) => plot.filter(isCoordinate));
    const normalized = normalizeBoundaryPlots([], plots);
    return {
      coordinates: normalized[0] ?? [],
      plots: normalized,
    };
  }

  if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
    const plots = (value as unknown[])
      .filter((plot): plot is unknown[] => Array.isArray(plot))
      .map((plot) => plot.filter(isCoordinate));
    const normalized = normalizeBoundaryPlots([], plots);
    return {
      coordinates: normalized[0] ?? [],
      plots: normalized,
    };
  }

  const coordinates = Array.isArray(value) ? value.filter(isCoordinate) : [];
  const plots = normalizeBoundaryPlots(coordinates);
  return {
    coordinates: plots[0] ?? [],
    plots,
  };
}

function toStoredCoordinates(plots: GeoCoordinate[][]): StoredBoundaryCoordinates {
  if (plots.length <= 1) {
    return plots[0] ?? [];
  }

  return { plots };
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

    const parsed = parseStoredCoordinates(record.coordinates);

    return {
      id: record.id,
      farmId: record.farmId,
      coordinates: parsed.coordinates,
      plots: parsed.plots,
      areaHectares: record.areaHectares,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /** Upserts a farm boundary polygon (one or more plots). */
  async upsert(input: {
    farmId: string;
    plots: GeoCoordinate[][];
    areaHectares: number;
  }): Promise<IFarmBoundaryRecord> {
    const stored = toStoredCoordinates(input.plots) as Prisma.InputJsonValue;
    const record = await prismaClient.farmBoundary.upsert({
      where: { farmId: input.farmId },
      create: {
        farmId: input.farmId,
        coordinates: stored,
        areaHectares: input.areaHectares,
      },
      update: {
        coordinates: stored,
        areaHectares: input.areaHectares,
      },
    });

    const parsed = parseStoredCoordinates(record.coordinates);

    return {
      id: record.id,
      farmId: record.farmId,
      coordinates: parsed.coordinates,
      plots: parsed.plots,
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
