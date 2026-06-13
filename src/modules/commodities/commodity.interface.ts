import { CommodityUnit } from '@/shared/constants';

/** Public commodity DTO returned by the API. */
export interface ICommodityOutput {
  id: string;
  name: string;
  code: string;
  imageUrl: string;
  unit: CommodityUnit;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a commodity. */
export interface ICreateCommodityInput {
  name: string;
  code: string;
  unit: CommodityUnit;
  storedImageFilename?: string;
}

/** Input for updating a commodity — at least one field required at route layer. */
export interface IUpdateCommodityInput {
  name?: string;
  code?: string;
  unit?: CommodityUnit;
  storedImageFilename?: string;
}

/** List response shape expected by the frontend. */
export interface IGetCommoditiesOutput {
  commodities: ICommodityOutput[];
  total: number;
}

/** Delete response shape expected by the frontend. */
export interface IDeleteCommodityOutput {
  success: boolean;
  id: string;
}

/** PostgreSQL commodity row returned from queries. */
export interface ICommodityRecord {
  id: string;
  name: string;
  code: string;
  imageUrl: string;
  unit: CommodityUnit;
  createdAt: Date;
  updatedAt: Date;
}
