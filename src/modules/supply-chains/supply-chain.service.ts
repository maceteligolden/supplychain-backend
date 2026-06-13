import { inject, injectable } from 'tsyringe';

import { ISupplyChainOutput, IGetSupplyChainsOutput } from './supply-chain.interface';
import { SupplyChainRepository } from './supply-chain.repository';

const mapSupplyChainToOutput = (record: {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: ISupplyChainOutput['status'];
  commodityId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ISupplyChainOutput => ({
  id: record.id,
  name: record.name,
  code: record.code,
  description: record.description ?? undefined,
  status: record.status,
  commodityId: record.commodityId ?? undefined,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

/**
 * SupplyChainService implements read-only supply chain queries.
 */
@injectable()
export class SupplyChainService {
  constructor(
    @inject(SupplyChainRepository)
    private readonly supplyChainRepository: SupplyChainRepository,
  ) {}

  /** Lists all supply chains with total count. */
  async listSupplyChains(): Promise<IGetSupplyChainsOutput> {
    const [records, total] = await Promise.all([
      this.supplyChainRepository.findAll(),
      this.supplyChainRepository.count(),
    ]);

    return {
      supplyChains: records.map(mapSupplyChainToOutput),
      total,
    };
  }
}
