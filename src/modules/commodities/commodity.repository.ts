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

  /** Deletes a commodity by id. Returns true when a row was removed. */
  async deleteById(id: string): Promise<boolean> {
    try {
      await prismaClient.commodity.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
