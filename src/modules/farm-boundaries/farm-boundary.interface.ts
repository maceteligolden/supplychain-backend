import type { GeoCoordinate } from '@/shared/utils/polygon.util';

export type IFarmBoundaryOutput = {
  farmId: string;
  coordinates: GeoCoordinate[];
  areaHectares: number;
  createdAt: string;
  updatedAt: string;
};

export type IFarmBoundaryRecord = {
  id: string;
  farmId: string;
  coordinates: GeoCoordinate[];
  areaHectares: number;
  createdAt: Date;
  updatedAt: Date;
};

export type IUpsertFarmBoundaryInput = {
  coordinates: GeoCoordinate[];
};

export type IGetFarmBoundaryOutput = {
  boundary: IFarmBoundaryOutput | null;
};

export type IDeleteFarmBoundaryOutput = {
  success: boolean;
  farmId: string;
};

export type IFarmGeocodeOutput = {
  latitude: number;
  longitude: number;
  displayName: string;
};
