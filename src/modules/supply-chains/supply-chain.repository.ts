import { injectable } from 'tsyringe';

import { SupplyChainStatus } from '@/shared/constants';
import { prismaClient } from '@/shared/database';

import { ISupplyChainRecord } from './supply-chain.interface';

/**
 * SupplyChainRepository handles PostgreSQL persistence for supply chains.
 */
@injectable()
export class SupplyChainRepository {
  /** Finds a supply chain by id. */
  async findById(id: string): Promise<ISupplyChainRecord | null> {
    return prismaClient.supplyChain.findUnique({ where: { id } });
  }

  /** Finds a supply chain by unique code. */
  async findByCode(code: string): Promise<ISupplyChainRecord | null> {
    return prismaClient.supplyChain.findUnique({
      where: { code: code.toUpperCase() },
    });
  }

  /** Returns all supply chains sorted by name. */
  async findAll(): Promise<ISupplyChainRecord[]> {
    return prismaClient.supplyChain.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /** Returns total supply chain count. */
  async count(): Promise<number> {
    return prismaClient.supplyChain.count();
  }

  /** Returns whether a supply chain has batch allocations. */
  async isReferencedByAllocations(id: string): Promise<boolean> {
    const count = await prismaClient.batchAllocation.count({
      where: { supplyChainId: id },
    });
    return count > 0;
  }

  /** Creates a supply chain row. */
  async create(input: {
    name: string;
    code: string;
    description?: string | null;
    status: SupplyChainStatus;
    commodityId?: string | null;
  }): Promise<ISupplyChainRecord> {
    return prismaClient.supplyChain.create({
      data: {
        name: input.name.trim(),
        code: input.code.toUpperCase(),
        description: input.description?.trim() || null,
        status: input.status,
        commodityId: input.commodityId ?? null,
      },
    });
  }

  /** Updates a supply chain by id. */
  async updateById(
    id: string,
    input: {
      name?: string;
      code?: string;
      description?: string | null;
      status?: SupplyChainStatus;
      commodityId?: string | null;
    },
  ): Promise<ISupplyChainRecord | null> {
    try {
      return await prismaClient.supplyChain.update({
        where: { id },
        data: {
          name: input.name?.trim(),
          code: input.code?.toUpperCase(),
          description:
            input.description !== undefined
              ? input.description?.trim() || null
              : undefined,
          status: input.status,
          commodityId: input.commodityId,
        },
      });
    } catch {
      return null;
    }
  }

  /** Deletes a supply chain by id. Returns true when a row was removed. */
  async deleteById(id: string): Promise<boolean> {
    try {
      await prismaClient.supplyChain.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
