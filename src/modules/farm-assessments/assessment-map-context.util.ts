import { featureCollection } from '@turf/helpers';

import type {
  IFarmAssessmentAnalysis,
  IFarmAssessmentMapContext,
  IFarmAssessmentMapLegendItem,
  IFarmAssessmentMapTileLayer,
  IFarmAssessmentProviderMetadata,
} from './farm-assessment.interface';
import { plotsBoundingBox, type GeoCoordinate } from '@/shared/utils/polygon.util';

const LEGEND_COLORS = {
  deforestation: '#dc2626',
  afforestation: '#16a34a',
  stability: '#166534',
  nonForest: '#a8a29e',
} as const;

const DEFAULT_TILE_LAYERS: IFarmAssessmentMapTileLayer[] = [
  {
    id: 'tree_cover_density',
    label: 'Tree cover density',
    urlTemplate:
      'https://tiles.globalforestwatch.org/umd_tree_cover_density_2000/latest/dynamic/{z}/{x}/{y}.png',
    opacity: 0.7,
    defaultVisible: true,
  },
  {
    id: 'tree_cover_loss',
    label: 'Tree cover loss',
    urlTemplate:
      'https://tiles.globalforestwatch.org/umd_tree_cover_loss/latest/dynamic/{z}/{x}/{y}.png?startYear=2021&endYear=2024',
    opacity: 0.8,
    defaultVisible: true,
  },
  {
    id: 'tree_cover_gain',
    label: 'Tree cover gain',
    urlTemplate:
      'https://tiles.globalforestwatch.org/umd_tree_cover_gain_from_height/latest/dynamic/{z}/{x}/{y}.png',
    opacity: 0.7,
    defaultVisible: true,
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
  const nonForestPercent = Math.max(
    0,
    Math.round(
      (100 -
        analysis.deforestationPercent -
        analysis.afforestationPercent -
        stablePercent) *
        100,
    ) / 100,
  );

  return [
    {
      category: 'Tree cover loss',
      color: LEGEND_COLORS.deforestation,
      percent: analysis.deforestationPercent,
      hectares: hectaresFromPercent(
        boundaryAreaHectares,
        analysis.deforestationPercent,
      ),
    },
    {
      category: 'Tree cover gain',
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
    {
      category: 'Non-forest',
      color: LEGEND_COLORS.nonForest,
      percent: nonForestPercent,
      hectares: hectaresFromPercent(boundaryAreaHectares, nonForestPercent),
    },
  ];
}

/** Builds map overlay context for a completed farm assessment. */
export function buildAssessmentMapContext(input: {
  boundary: GeoCoordinate[];
  plots?: GeoCoordinate[][];
  boundaryAreaHectares: number;
  analysis: IFarmAssessmentAnalysis;
  providerMetadata: IFarmAssessmentProviderMetadata | null;
}): IFarmAssessmentMapContext {
  const plots = input.plots && input.plots.length > 0 ? input.plots : [input.boundary];
  const bounds = plotsBoundingBox(plots);

  return {
    boundary: plots[0] ?? input.boundary,
    plots,
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
