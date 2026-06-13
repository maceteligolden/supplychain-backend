import { injectable } from 'tsyringe';

import { FarmStatus } from '@/shared/constants';
import { prismaClient } from '@/shared/database';

import {
  IFarmLocationRecord,
  IFarmOwnerRecord,
  IFarmRecord,
  IUpdateFarmInput,
} from './farm.interface';

const farmCommodityInclude = {
  commodities: {
    select: { commodityId: true },
  },
} as const;

type FarmWithCommodities = {
  id: string;
  name: string;
  code: string;
  status: FarmStatus;
  ownerFirstName: string;
  ownerLastName: string;
  ownerPhone: string;
  ownerEmail: string;
  country: string;
  region: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  annualProductionEstimateKg: number | null;
  areaHectares: number | null;
  declarationAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
  commodities: { commodityId: string }[];
};

const mapFarmRow = (row: FarmWithCommodities): IFarmRecord => ({
  id: row.id,
  name: row.name,
  code: row.code,
  status: row.status,
  ownerFirstName: row.ownerFirstName,
  ownerLastName: row.ownerLastName,
  ownerPhone: row.ownerPhone,
  ownerEmail: row.ownerEmail,
  country: row.country,
  region: row.region,
  city: row.city,
  latitude: row.latitude,
  longitude: row.longitude,
  annualProductionEstimateKg: row.annualProductionEstimateKg,
  areaHectares: row.areaHectares,
  declarationAccepted: row.declarationAccepted,
  commodityIds: row.commodities.map((link) => link.commodityId),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/**
 * FarmRepository handles PostgreSQL persistence for farms.
 */
@injectable()
export class FarmRepository {
  /** Returns all farms sorted by name with commodity links. */
  async findAll(): Promise<IFarmRecord[]> {
    const rows = await prismaClient.farm.findMany({
      orderBy: { name: 'asc' },
      include: farmCommodityInclude,
    });

    return rows.map(mapFarmRow);
  }

  /** Returns total farm count. */
  async countAll(): Promise<number> {
    return prismaClient.farm.count();
  }

  /** Finds a farm by id with commodity links. */
  async findById(id: string): Promise<IFarmRecord | null> {
    const row = await prismaClient.farm.findUnique({
      where: { id },
      include: farmCommodityInclude,
    });

    return row ? mapFarmRow(row) : null;
  }

  /** Finds a farm by unique code with commodity links. */
  async findByCode(code: string): Promise<IFarmRecord | null> {
    const row = await prismaClient.farm.findUnique({
      where: { code: code.toUpperCase() },
      include: farmCommodityInclude,
    });

    return row ? mapFarmRow(row) : null;
  }

  /** Returns true when any batch references this farm. */
  async isReferencedByBatches(id: string): Promise<boolean> {
    const count = await prismaClient.batch.count({ where: { farmId: id } });
    return count > 0;
  }

  /** Replaces commodity links for a farm. */
  async setCommodities(farmId: string, commodityIds: string[]): Promise<void> {
    await prismaClient.$transaction([
      prismaClient.farmCommodity.deleteMany({ where: { farmId } }),
      prismaClient.farmCommodity.createMany({
        data: commodityIds.map((commodityId) => ({ farmId, commodityId })),
      }),
    ]);
  }

  /** Creates a new farm row. */
  async create(input: {
    name: string;
    code: string;
    status: FarmStatus;
    owner: IFarmOwnerRecord;
    location: IFarmLocationRecord;
    annualProductionEstimateKg?: number;
    areaHectares?: number;
    declarationAccepted: boolean;
  }): Promise<IFarmRecord> {
    const row = await prismaClient.farm.create({
      data: {
        name: input.name.trim(),
        code: input.code.toUpperCase(),
        status: input.status,
        ownerFirstName: input.owner.ownerFirstName,
        ownerLastName: input.owner.ownerLastName,
        ownerPhone: input.owner.ownerPhone,
        ownerEmail: input.owner.ownerEmail,
        country: input.location.country,
        region: input.location.region,
        city: input.location.city,
        latitude: input.location.latitude ?? null,
        longitude: input.location.longitude ?? null,
        annualProductionEstimateKg: input.annualProductionEstimateKg ?? null,
        areaHectares: input.areaHectares ?? null,
        declarationAccepted: input.declarationAccepted,
      },
      include: farmCommodityInclude,
    });

    return mapFarmRow(row);
  }

  /** Updates a farm by id. */
  async updateById(
    id: string,
    input: {
      name?: string;
      code?: string;
      status?: IUpdateFarmInput['status'];
      owner?: Partial<IFarmOwnerRecord>;
      location?: Partial<IFarmLocationRecord>;
      annualProductionEstimateKg?: number | null;
      areaHectares?: number | null;
      declarationAccepted?: boolean;
    },
  ): Promise<IFarmRecord | null> {
    try {
      const row = await prismaClient.farm.update({
        where: { id },
        data: {
          name: input.name?.trim(),
          code: input.code?.toUpperCase(),
          status: input.status,
          ownerFirstName: input.owner?.ownerFirstName,
          ownerLastName: input.owner?.ownerLastName,
          ownerPhone: input.owner?.ownerPhone,
          ownerEmail: input.owner?.ownerEmail,
          country: input.location?.country,
          region: input.location?.region,
          city: input.location?.city,
          latitude: input.location?.latitude,
          longitude: input.location?.longitude,
          annualProductionEstimateKg: input.annualProductionEstimateKg,
          areaHectares: input.areaHectares,
          declarationAccepted: input.declarationAccepted,
        },
        include: farmCommodityInclude,
      });

      return mapFarmRow(row);
    } catch {
      return null;
    }
  }

  /** Deletes a farm by id. Returns true when a row was removed. */
  async deleteById(id: string): Promise<boolean> {
    try {
      await prismaClient.farm.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
