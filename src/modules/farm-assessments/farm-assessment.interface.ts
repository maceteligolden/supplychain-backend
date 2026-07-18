import type { AssessmentRiskLevel } from '@/shared/constants';
import type { GeoCoordinate } from '@/shared/utils/polygon.util';

export type IFarmAssessmentAnalysis = {
  deforestationPercent: number;
  afforestationPercent: number;
  stabilityPercent: number;
  forestCoverPercent: number;
  protectedAreaOverlapPercent: number;
  protectedAreaDetected: boolean;
  whispRiskPcrop?: string | null;
};

export type FarmAssessmentStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';

export type FarmAssessmentSource = 'GFW_WDPA' | 'WHISP_GFW_WDPA' | 'FALLBACK';

export type IFarmAssessmentProviderMetadata = {
  whisp?: {
    source: 'WHISP' | 'FALLBACK';
    rawProperties?: Record<string, unknown>;
  };
  wdpa?: {
    source: 'WDPA' | 'FALLBACK';
    protectedAreas?: GeoJSON.FeatureCollection;
    proximityBuffer?: GeoJSON.Feature | null;
    nearestProtectedArea?: { name: string; distanceKm: number } | null;
  };
  gfw?: {
    geostoreId?: string | null;
  };
};

export type IFarmAssessmentMapLegendItem = {
  category: string;
  color: string;
  percent: number;
  hectares: number;
};

export type IFarmAssessmentMapTileLayer = {
  id: string;
  label: string;
  urlTemplate: string;
  opacity: number;
  defaultVisible: boolean;
};

export type IFarmAssessmentMapContext = {
  boundary: GeoCoordinate[];
  /** All plot rings for multi-plot farms. */
  plots: GeoCoordinate[][];
  bbox: [number, number, number, number];
  legend: IFarmAssessmentMapLegendItem[];
  tileLayers: IFarmAssessmentMapTileLayer[];
  protectedAreas: GeoJSON.FeatureCollection;
  proximityBuffer: GeoJSON.Feature | null;
  nearestProtectedArea: { name: string; distanceKm: number } | null;
  whispRiskPcrop: string | null;
};

export type IFarmAssessmentOutput = {
  id: string;
  farmId: string;
  riskLevel: AssessmentRiskLevel | null;
  analysis: IFarmAssessmentAnalysis | null;
  assessedAt: string | null;
  boundaryAreaHectares: number | null;
  status: FarmAssessmentStatus;
  /** Data provenance: live providers vs deterministic demo fallback. */
  source: FarmAssessmentSource;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

export type IFarmAssessmentRecord = {
  id: string;
  farmId: string;
  riskLevel: AssessmentRiskLevel | null;
  analysis: IFarmAssessmentAnalysis | null;
  assessedAt: Date | null;
  boundaryAreaHectares: number | null;
  status: FarmAssessmentStatus;
  errorMessage: string | null;
  source: FarmAssessmentSource;
  providerMetadata: IFarmAssessmentProviderMetadata | null;
  createdAt: Date;
  updatedAt: Date;
};

export type IGetFarmAssessmentsOutput = {
  assessments: IFarmAssessmentOutput[];
  total: number;
};

export type IFarmLandCoverPointOutput = {
  observedAt: string;
  forestCoverPercent: number;
  deforestationPercent: number;
  source: 'BASELINE' | 'ASSESSMENT';
  assessmentId?: string;
};

export type IGetFarmLandCoverTimelineOutput = {
  points: IFarmLandCoverPointOutput[];
};

/** Shape consumed by supply chain risk aggregation. */
export type IFarmAssessmentSummary = {
  id: string;
  farmId: string;
  riskLevel: AssessmentRiskLevel;
  analysis: IFarmAssessmentAnalysis;
  assessedAt: string;
  boundaryAreaHectares: number;
  createdAt: string;
};
