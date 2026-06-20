import area from '@turf/area';
import bbox from '@turf/bbox';
import booleanIntersects from '@turf/boolean-intersects';
import buffer from '@turf/buffer';
import centroid from '@turf/centroid';
import distance from '@turf/distance';
import intersect from '@turf/intersect';
import { injectable } from 'tsyringe';

import { ENV } from '@/shared/constants';
import type { AssessmentAnalysisMetrics } from '@/modules/farm-assessments/assessment-risk.util';

export type WdpaProtectedAreaFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  { name?: string; wdpaId?: string | number; designation?: string }
>;

export type WdpaAnalysisResult = Pick<
  AssessmentAnalysisMetrics,
  'protectedAreaOverlapPercent' | 'protectedAreaDetected'
> & {
  protectedAreas: GeoJSON.FeatureCollection;
  proximityBuffer: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null;
  nearestProtectedArea: { name: string; distanceKm: number } | null;
  source: 'WDPA' | 'FALLBACK';
};

const WDPA_V4_SEARCH_URL = 'https://api.protectedplanet.net/v4/protected_areas/search';

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function farmFeature(geoJson: GeoJSON.Polygon): GeoJSON.Feature<GeoJSON.Polygon> {
  return { type: 'Feature', properties: {}, geometry: geoJson };
}

function hectaresFromFeature(feature: GeoJSON.Feature): number {
  return area(feature) / 10_000;
}

function normalizeProtectedAreaFeature(
  item: Record<string, unknown>,
): WdpaProtectedAreaFeature | null {
  const geometry = item.geometry ?? item.geojson;

  if (!geometry || typeof geometry !== 'object') {
    return null;
  }

  const typedGeometry = geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;

  if (typedGeometry.type !== 'Polygon' && typedGeometry.type !== 'MultiPolygon') {
    return null;
  }

  return {
    type: 'Feature',
    properties: {
      name:
        (typeof item.name === 'string' && item.name) ||
        (typeof item.original_name === 'string' && item.original_name) ||
        'Protected area',
      wdpaId:
        (typeof item.id === 'number' && item.id) ||
        (typeof item.wdpa_id === 'number' && item.wdpa_id) ||
        undefined,
      designation:
        (typeof item.designation === 'string' && item.designation) ||
        (typeof item.designation_type === 'string' && item.designation_type) ||
        undefined,
    },
    geometry: typedGeometry,
  };
}

/**
 * WdpaClient estimates protected-area overlap and proximity for a farm polygon.
 */
@injectable()
export class WdpaClient {
  /** Returns protected-area overlap metrics and geometries for a GeoJSON polygon. */
  async analyzeProtectedAreas(input: {
    geoJson: GeoJSON.Polygon;
    farmId: string;
    centroidLatitude: number;
    farmAreaHectares: number;
  }): Promise<WdpaAnalysisResult> {
    if (!ENV.WDPA_API_TOKEN) {
      return this.buildHeuristicOverlap(input);
    }

    try {
      const farm = farmFeature(input.geoJson);
      const bounds = bbox(farm);
      const url = new URL(WDPA_V4_SEARCH_URL);
      url.searchParams.set('token', ENV.WDPA_API_TOKEN);
      url.searchParams.set('with_geometry', 'true');
      url.searchParams.set('per_page', '50');
      url.searchParams.set('bbox', bounds.join(','));

      const response = await fetch(url.toString());

      if (!response.ok) {
        return this.buildHeuristicOverlap(input);
      }

      const payload = (await response.json()) as {
        results?: Record<string, unknown>[];
        protected_areas?: Record<string, unknown>[];
        data?: Record<string, unknown>[];
      };

      const rawResults =
        payload.results ?? payload.protected_areas ?? payload.data ?? [];
      const protectedAreaFeatures = rawResults
        .map((item) => normalizeProtectedAreaFeature(item))
        .filter((feature): feature is WdpaProtectedAreaFeature => feature !== null);

      return this.computeOverlapMetrics({
        farm,
        farmAreaHectares: input.farmAreaHectares,
        protectedAreaFeatures,
      });
    } catch {
      return this.buildHeuristicOverlap(input);
    }
  }

  private computeOverlapMetrics(input: {
    farm: GeoJSON.Feature<GeoJSON.Polygon>;
    farmAreaHectares: number;
    protectedAreaFeatures: WdpaProtectedAreaFeature[];
  }): WdpaAnalysisResult {
    const overlappingFeatures: WdpaProtectedAreaFeature[] = [];
    let overlapHectares = 0;

    for (const protectedArea of input.protectedAreaFeatures) {
      if (!booleanIntersects(input.farm, protectedArea)) {
        continue;
      }

      const intersection = intersect({
        type: 'FeatureCollection',
        features: [input.farm, protectedArea],
      });

      if (!intersection) {
        continue;
      }

      overlapHectares += hectaresFromFeature(intersection);
      overlappingFeatures.push(protectedArea);
    }

    const overlapPercent = Math.min(
      100,
      Math.round((overlapHectares / Math.max(input.farmAreaHectares, 0.01)) * 100),
    );

    const nearestProtectedArea = this.findNearestProtectedArea(
      input.farm,
      input.protectedAreaFeatures,
    );

    const proximityBuffer =
      nearestProtectedArea && ENV.PA_PROXIMITY_BUFFER_KM > 0
        ? (buffer(input.farm, ENV.PA_PROXIMITY_BUFFER_KM, {
            units: 'kilometers',
          }) as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>)
        : null;

    return {
      protectedAreaOverlapPercent: overlapPercent,
      protectedAreaDetected: overlapPercent >= 3 || overlappingFeatures.length > 0,
      protectedAreas: {
        type: 'FeatureCollection',
        features: overlappingFeatures,
      },
      proximityBuffer,
      nearestProtectedArea,
      source: 'WDPA',
    };
  }

  private findNearestProtectedArea(
    farm: GeoJSON.Feature<GeoJSON.Polygon>,
    protectedAreaFeatures: WdpaProtectedAreaFeature[],
  ): { name: string; distanceKm: number } | null {
    if (protectedAreaFeatures.length === 0) {
      return null;
    }

    let nearest: { name: string; distanceKm: number } | null = null;

    for (const protectedArea of protectedAreaFeatures) {
      const distanceKm = distance(centroid(farm), centroid(protectedArea), {
        units: 'kilometers',
      });

      if (!nearest || distanceKm < nearest.distanceKm) {
        nearest = {
          name: protectedArea.properties.name ?? 'Protected area',
          distanceKm: Math.round(distanceKm * 100) / 100,
        };
      }
    }

    return nearest;
  }

  private buildHeuristicOverlap(input: {
    geoJson: GeoJSON.Polygon;
    farmId: string;
    centroidLatitude: number;
    farmAreaHectares: number;
  }): WdpaAnalysisResult {
    const hash = hashString(input.farmId);
    const protectedAreaOverlapPercent = Math.min(
      40,
      Math.round(
        (hash % 20) +
          (input.centroidLatitude > 6 && input.centroidLatitude < 7 ? 8 : 0),
      ),
    );

    const farm = farmFeature(input.geoJson);
    const proximityBuffer =
      ENV.PA_PROXIMITY_BUFFER_KM > 0
        ? (buffer(farm, ENV.PA_PROXIMITY_BUFFER_KM, {
            units: 'kilometers',
          }) as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>)
        : null;

    return {
      protectedAreaOverlapPercent,
      protectedAreaDetected: protectedAreaOverlapPercent >= 3,
      protectedAreas: { type: 'FeatureCollection', features: [] },
      proximityBuffer,
      nearestProtectedArea:
        protectedAreaOverlapPercent >= 3
          ? {
              name: 'Simulated protected area',
              distanceKm: Math.max(0.2, ENV.PA_PROXIMITY_BUFFER_KM / 2),
            }
          : null,
      source: 'FALLBACK',
    };
  }
}
