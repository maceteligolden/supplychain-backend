import { FarmStatus } from '@/shared/constants';

/** Nested owner DTO returned by the API. */
export interface IFarmOwnerOutput {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

/** Nested location DTO returned by the API. */
export interface IFarmLocationOutput {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

/** Public farm DTO returned by the API. */
export interface IFarmOutput {
  id: string;
  name: string;
  code: string;
  status: FarmStatus;
  owner: IFarmOwnerOutput;
  commodityIds: string[];
  location: IFarmLocationOutput;
  annualProductionEstimateKg?: number;
  areaHectares?: number;
  declarationAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a farm. */
export interface ICreateFarmInput {
  name: string;
  code: string;
  status?: FarmStatus;
  owner: IFarmOwnerOutput;
  commodityIds: string[];
  location: IFarmLocationOutput;
  annualProductionEstimateKg?: number;
  areaHectares?: number;
  declarationAccepted: boolean;
}

/** Input for updating a farm — at least one field required at route layer. */
export interface IUpdateFarmInput {
  name?: string;
  code?: string;
  status?: FarmStatus;
  owner?: Partial<IFarmOwnerOutput>;
  commodityIds?: string[];
  location?: Partial<IFarmLocationOutput>;
  annualProductionEstimateKg?: number | null;
  areaHectares?: number | null;
  declarationAccepted?: boolean;
}

/** List response shape expected by the frontend. */
export interface IGetFarmsOutput {
  farms: IFarmOutput[];
  total: number;
}

/** Delete response shape expected by the frontend. */
export interface IDeleteFarmOutput {
  success: boolean;
  id: string;
}

/** PostgreSQL farm row returned from queries. */
export interface IFarmRecord {
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
  commodityIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

/** Normalized owner fields for repository writes. */
export interface IFarmOwnerRecord {
  ownerFirstName: string;
  ownerLastName: string;
  ownerPhone: string;
  ownerEmail: string;
}

/** Normalized location fields for repository writes. */
export interface IFarmLocationRecord {
  country: string;
  region: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
}
