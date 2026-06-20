import bbox from '@turf/bbox';
import { featureCollection } from '@turf/helpers';

import type {
  IFarmAssessmentAnalysis,
  IFarmAssessmentMapContext,
  IFarmAssessmentMapLegendItem,
  IFarmAssessmentMapTileLayer,
  IFarmAssessmentProviderMetadata,
} from './farm-assessment.interface';
import type { GeoCoordinate } from '@/shared/utils/polygon.util';

const LEGEND_COLORS = {
  landMass: '#2f6f4f',
  deforestation: '#dc2626',
  afforestation: '#16a34a',
  stability: '#166534',
} as const;

const DEFAULT_TILE_LAYERS: IFarmAssessmentMapTileLayer[] = [
  {
    id: 'tree_cover_loss',
    label: 'Tree cover loss',
    urlTemplate:
      'https://tiles.globalforestwatch.org/umd_tree_cover_loss/latest/dynamic/{z}/{x}/{y}.png?startYear=2021&endYear=2024',
    opacity: 0.75,
    defaultVisible: true,
  },
  {
    id: 'tree_cover_gain',
    label: 'Tree cover gain',
    urlTemplate:
      'https://tiles.globalforestwatch.org/umd_tree_cover_gain_from_height/latest/dynamic/{z}/{x}/{y}.png',
    opacity: 0.65,
    defaultVisible: true,
  },
  {
    id: 'integrated_alerts',
    label: 'Integrated alerts',
    urlTemplate:
      'https://tiles.globalforestwatch.org/gfw_integrated_alerts/latest/dynamic/{z}/{x}/{y}.png',
    opacity: 0.7,
    defaultVisible: false,
  },
  {
    id: 'cocoa_risk',
    label: 'West Africa cocoa risk',
    urlTemplate:
      'https://tiles.globalforestwatch.org/gfw_west_africa_cocoa_deforestation_risk/latest/dynamic/{z}/{x}/{y}.png',
    opacity: 0.55,
    defaultVisible: false,
  },
];

function hectaresFromPercent(totalHectares: number, percent: number): number {
  return Math.round(((totalHectares * percent) / 100) * 100) / 100;
}

function buildLegend(
  analysis: IFarmAssessmentAnalysis,
  boundaryAreaHectares: number,
): IFarmAssessmentMapLegendItem[] {
  const stablePercent = Math.max(
    0,
    analysis.stabilityPercent ??
      Math.max(0, 100 - analysis.deforestationPercent - analysis.afforestationPercent),
  );

  return [
    {
      category: 'Farm land mass',
      color: LEGEND_COLORS.landMass,
      percent: 100,
      hectares: boundaryAreaHectares,
    },
    {
      category: 'Deforestation (loss)',
      color: LEGEND_COLORS.deforestation,
      percent: analysis.deforestationPercent,
      hectares: hectaresFromPercent(
        boundaryAreaHectares,
        analysis.deforestationPercent,
      ),
    },
    {
      category: 'Afforestation (gain)',
      color: LEGEND_COLORS.afforestation,
      percent: analysis.afforestationPercent,
      hectares: hectaresFromPercent(
        boundaryAreaHectares,
        analysis.afforestationPercent,
      ),
    },
    {
      category: 'Stable cover',
      color: LEGEND_COLORS.stability,
      percent: stablePercent,
      hectares: hectaresFromPercent(boundaryAreaHectares, stablePercent),
    },
  ];
}

/** Builds map overlay context for a completed farm assessment. */
export function buildAssessmentMapContext(input: {
  boundary: GeoCoordinate[];
  boundaryAreaHectares: number;
  analysis: IFarmAssessmentAnalysis;
  providerMetadata: IFarmAssessmentProviderMetadata | null;
}): IFarmAssessmentMapContext {
  const polygonFeature: GeoJSON.Feature<GeoJSON.Polygon> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        input.boundary.map((coordinate) => [coordinate.longitude, coordinate.latitude]),
      ],
    },
  };

  const bounds = bbox(polygonFeature) as [number, number, number, number];

  return {
    boundary: input.boundary,
    bbox: bounds,
    legend: buildLegend(input.analysis, input.boundaryAreaHectares),
    tileLayers: DEFAULT_TILE_LAYERS,
    protectedAreas: featureCollection([]),
    proximityBuffer: null,
    nearestProtectedArea: null,
    whispRiskPcrop: input.analysis.whispRiskPcrop ?? null,
  };
}

export { LEGEND_COLORS };
