import type { GeoCoordinate } from '@/shared/utils/polygon.util';

export type IFarmBoundaryOutput = {
  farmId: string;
  /** Primary / first plot ring (compat). */
  coordinates: GeoCoordinate[];
  /** All plot rings (multi-plot). */
  plots: GeoCoordinate[][];
  areaHectares: number;
  createdAt: string;
  updatedAt: string;
};

export type IFarmBoundaryRecord = {
  id: string;
  farmId: string;
  coordinates: GeoCoordinate[];
  plots: GeoCoordinate[][];
  areaHectares: number;
  createdAt: Date;
  updatedAt: Date;
};

export type IUpsertFarmBoundaryInput = {
  /** Legacy single-ring polygon. */
  coordinates?: GeoCoordinate[];
  /** Multi-plot rings (1–20 plots, 3–500 vertices each). */
  plots?: GeoCoordinate[][];
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
