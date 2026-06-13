import { injectable } from 'tsyringe';

import { prismaClient } from '@/shared/database';

import { ISupplyChainRecord } from './supply-chain.interface';

/**
 * SupplyChainRepository handles PostgreSQL reads for supply chains.
 */
@injectable()
export class SupplyChainRepository {
  /** Finds a supply chain by id. */
  async findById(id: string): Promise<ISupplyChainRecord | null> {
    return prismaClient.supplyChain.findUnique({ where: { id } });
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
}
