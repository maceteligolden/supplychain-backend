import { SupplyChainStatus } from '@/shared/constants';

/** PostgreSQL supply chain row returned from queries. */
export interface ISupplyChainRecord {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: SupplyChainStatus;
  commodityId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** API supply chain DTO. */
export interface ISupplyChainOutput {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: SupplyChainStatus;
  commodityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IGetSupplyChainsOutput {
  supplyChains: ISupplyChainOutput[];
  total: number;
}
