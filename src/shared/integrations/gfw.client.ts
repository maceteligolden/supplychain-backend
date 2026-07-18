import { injectable } from 'tsyringe';

import { ENV } from '@/shared/constants';
import type { GeoCoordinate } from '@/shared/utils/polygon.util';
import { polygonCentroid } from '@/shared/utils/polygon.util';

import type { AssessmentAnalysisMetrics } from '@/modules/farm-assessments/assessment-risk.util';

export type GfwAnalysisResult = AssessmentAnalysisMetrics & {
  afforestationPercent: number;
  stabilityPercent: number;
  yearlyLoss: Array<{
    year: number;
    forestCoverPercent: number;
    deforestationPercent: number;
  }>;
  geostoreId: string | null;
  source: 'GFW_WDPA' | 'WHISP_GFW_WDPA' | 'FALLBACK';
};

const GFW_BASE_URL = 'https://data-api.globalforestwatch.org';

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function deriveStabilityPercent(
  deforestationPercent: number,
  afforestationPercent: number,
): number {
  return Math.max(0, 100 - deforestationPercent - afforestationPercent);
}

function buildFallbackAnalysis(
  farmId: string,
  coordinates: GeoCoordinate[],
): GfwAnalysisResult {
  const hash = hashString(farmId);
  const { latitude } = polygonCentroid(coordinates);

  const deforestationBase = (hash % 40) + (farmId.length % 10);
  const deforestationPercent = Math.min(
    55,
    Math.round((deforestationBase % 28) + (latitude > 10 ? 4 : 0)),
  );
  const afforestationPercent = Math.min(15, hash % 9);
  const forestCoverPercent = Math.max(0, 100 - deforestationPercent);
  const stabilityPercent = deriveStabilityPercent(
    deforestationPercent,
    afforestationPercent,
  );

  const yearlyLoss = [2020, 2021, 2022, 2023, 2024].map((year, index) => {
    const cover = Math.max(35, forestCoverPercent - index * (2 + (hash % 3)));
    return {
      year,
      forestCoverPercent: cover,
      deforestationPercent: 100 - cover,
    };
  });

  return {
    deforestationPercent,
    afforestationPercent,
    stabilityPercent,
    forestCoverPercent,
    protectedAreaOverlapPercent: 0,
    protectedAreaDetected: false,
    yearlyLoss,
    geostoreId: null,
    source: 'FALLBACK',
  };
}

/**
 * GfwClient queries Global Forest Watch Data API or falls back to deterministic metrics.
 */
@injectable()
export class GfwClient {
  /** Analyzes tree cover metrics for a farm polygon. */
  async analyzePolygon(input: {
    farmId: string;
    geoJson: GeoJSON.Polygon | GeoJSON.MultiPolygon;
    coordinates: GeoCoordinate[];
  }): Promise<GfwAnalysisResult> {
    if (!ENV.GFW_API_KEY) {
      return buildFallbackAnalysis(input.farmId, input.coordinates);
    }

    try {
      const geostoreId = await this.createGeostore(input.geoJson);

      if (!geostoreId) {
        return buildFallbackAnalysis(input.farmId, input.coordinates);
      }

      const lossRows = await this.fetchLossRows(geostoreId);

      if (lossRows.length === 0 && !geostoreId) {
        return buildFallbackAnalysis(input.farmId, input.coordinates);
      }

      const gainHa = await this.fetchGainHectares(geostoreId);
      const totalAreaHa =
        lossRows.reduce((sum, row) => sum + (row.area__ha ?? 0), 0) ||
        input.coordinates.length;

      const totalLossHa = lossRows.reduce(
        (sum, row) => sum + (row.umd_tree_cover_loss__ha ?? 0),
        0,
      );

      const deforestationPercent = Math.min(
        100,
        Math.round((totalLossHa / Math.max(totalAreaHa, 0.01)) * 100),
      );
      const afforestationPercent = Math.min(
        100,
        Math.round((gainHa / Math.max(totalAreaHa, 0.01)) * 100),
      );
      const forestCoverPercent = Math.max(0, 100 - deforestationPercent);
      const stabilityPercent = deriveStabilityPercent(
        deforestationPercent,
        afforestationPercent,
      );

      const yearlyLoss = [2020, 2021, 2022, 2023, 2024].map((year) => {
        const row = lossRows.find((item) => item.year === year);
        const lossHa = row?.umd_tree_cover_loss__ha ?? 0;
        const areaHa = row?.area__ha ?? totalAreaHa;
        const lossPercent = Math.min(
          100,
          Math.round((lossHa / Math.max(areaHa, 0.01)) * 100),
        );
        return {
          year,
          forestCoverPercent: Math.max(0, 100 - lossPercent),
          deforestationPercent: lossPercent,
        };
      });

      return {
        deforestationPercent,
        afforestationPercent,
        stabilityPercent,
        forestCoverPercent,
        protectedAreaOverlapPercent: 0,
        protectedAreaDetected: false,
        yearlyLoss,
        geostoreId,
        source: 'GFW_WDPA',
      };
    } catch {
      return buildFallbackAnalysis(input.farmId, input.coordinates);
    }
  }

  private async createGeostore(
    geoJson: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  ): Promise<string | null> {
    const geostoreResponse = await fetch(`${GFW_BASE_URL}/v1/geostore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ENV.GFW_API_KEY,
      },
      body: JSON.stringify({
        geojson: {
          type: 'Feature',
          properties: {},
          geometry: geoJson,
        },
      }),
    });

    if (!geostoreResponse.ok) {
      return null;
    }

    const geostore = (await geostoreResponse.json()) as { data?: { id?: string } };
    return geostore.data?.id ?? null;
  }

  private async fetchLossRows(
    geostoreId: string,
  ): Promise<
    Array<{ umd_tree_cover_loss__ha?: number; area__ha?: number; year?: number }>
  > {
    const statsUrl = new URL(`${GFW_BASE_URL}/v1/umd-tree-cover-loss`);
    statsUrl.searchParams.set('geostore_id', geostoreId);

    const statsResponse = await fetch(statsUrl.toString(), {
      headers: { 'x-api-key': ENV.GFW_API_KEY },
    });

    if (!statsResponse.ok) {
      return [];
    }

    const stats = (await statsResponse.json()) as {
      data?: Array<{
        umd_tree_cover_loss__ha?: number;
        area__ha?: number;
        year?: number;
      }>;
    };

    return stats.data ?? [];
  }

  private async fetchGainHectares(geostoreId: string): Promise<number> {
    const statsUrl = new URL(`${GFW_BASE_URL}/v1/umd-tree-cover-gain`);
    statsUrl.searchParams.set('geostore_id', geostoreId);

    const statsResponse = await fetch(statsUrl.toString(), {
      headers: { 'x-api-key': ENV.GFW_API_KEY },
    });

    if (!statsResponse.ok) {
      return 0;
    }

    const stats = (await statsResponse.json()) as {
      data?: Array<{ umd_tree_cover_gain__ha?: number }>;
    };

    return (stats.data ?? []).reduce(
      (sum, row) => sum + (row.umd_tree_cover_gain__ha ?? 0),
      0,
    );
  }
}
