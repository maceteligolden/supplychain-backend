import { Prisma } from '@prisma/client';
import { injectable } from 'tsyringe';

import { prismaClient } from '@/shared/database';

import {
  ICommodityRecord,
  ICreateCommodityInput,
  IUpdateCommodityInput,
} from './commodity.interface';

/**
 * CommodityRepository handles PostgreSQL persistence for commodities.
 */
@injectable()
export class CommodityRepository {
  /** Returns all commodities sorted by name. */
  async findAll(): Promise<ICommodityRecord[]> {
    return prismaClient.commodity.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /** Returns total commodity count. */
  async countAll(): Promise<number> {
    return prismaClient.commodity.count();
  }

  /** Finds a commodity by id. */
  async findById(id: string): Promise<ICommodityRecord | null> {
    return prismaClient.commodity.findUnique({ where: { id } });
  }

  /** Finds a commodity by unique code. */
  async findByCode(code: string): Promise<ICommodityRecord | null> {
    return prismaClient.commodity.findUnique({
      where: { code: code.toUpperCase() },
    });
  }

  /** Creates a new commodity row. */
  async create(input: {
    name: string;
    code: string;
    unit: ICreateCommodityInput['unit'];
    imageUrl: string;
  }): Promise<ICommodityRecord> {
    return prismaClient.commodity.create({
      data: {
        name: input.name.trim(),
        code: input.code.toUpperCase(),
        unit: input.unit,
        imageUrl: input.imageUrl,
      },
    });
  }

  /** Updates a commodity by id. */
  async updateById(
    id: string,
    input: {
      name?: string;
      code?: string;
      unit?: IUpdateCommodityInput['unit'];
      imageUrl?: string;
    },
  ): Promise<ICommodityRecord | null> {
    try {
      return await prismaClient.commodity.update({
        where: { id },
        data: {
          name: input.name?.trim(),
          code: input.code?.toUpperCase(),
          unit: input.unit,
          imageUrl: input.imageUrl,
        },
      });
    } catch {
      return null;
    }
  }

  /** Returns true when the commodity is referenced by farm links or batches. */
  async isReferencedByFarmsOrBatches(id: string): Promise<boolean> {
    const [farmLinkCount, batchCount] = await Promise.all([
      prismaClient.farmCommodity.count({ where: { commodityId: id } }),
      prismaClient.batch.count({ where: { commodityId: id } }),
    ]);

    return farmLinkCount > 0 || batchCount > 0;
  }

  /**
   * Deletes a commodity by id. Returns true when a row was removed and false
   * when the row does not exist (Prisma P2025). Other failures — including
   * foreign-key restrictions — are rethrown so callers do not mistake them
   * for a missing row.
   */
  async deleteById(id: string): Promise<boolean> {
    try {
      await prismaClient.commodity.delete({ where: { id } });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      throw error;
    }
  }
}
