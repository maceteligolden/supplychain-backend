import { injectable } from 'tsyringe';

import { ENV } from '@/shared/constants';
import type { GeoCoordinate } from '@/shared/utils/polygon.util';
import { polygonCentroid } from '@/shared/utils/polygon.util';

const WHISP_BASE_URL = 'https://whisp.openforis.org/api';

export type WhispAnalysisResult = {
  whispRiskPcrop: string | null;
  afforestationPercent: number | null;
  lossPercent: number | null;
  rawProperties: Record<string, unknown>;
  source: 'WHISP' | 'FALLBACK';
};

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function buildFallbackWhisp(
  farmId: string,
  coordinates: GeoCoordinate[],
): WhispAnalysisResult {
  const hash = hashString(farmId);
  const { latitude } = polygonCentroid(coordinates);
  const lossPercent = Math.min(40, (hash % 22) + (latitude > 6 ? 6 : 0));
  const afforestationPercent = Math.min(15, hash % 8);
  const riskLevels = ['Low', 'Medium', 'High'] as const;
  const whispRiskPcrop = riskLevels[hash % 3] ?? 'Low';

  return {
    whispRiskPcrop,
    lossPercent,
    afforestationPercent,
    rawProperties: {
      Risk_PCrop: whispRiskPcrop,
      source: 'FALLBACK',
    },
    source: 'FALLBACK',
  };
}

function readNumericProperty(
  properties: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const direct = properties[key];
    if (typeof direct === 'number' && Number.isFinite(direct)) {
      return direct;
    }

    const match = Object.entries(properties).find(
      ([propertyKey]) => propertyKey.toLowerCase() === key.toLowerCase(),
    );

    if (match && typeof match[1] === 'number' && Number.isFinite(match[1])) {
      return match[1];
    }
  }

  return null;
}

function readStringProperty(
  properties: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const direct = properties[key];
    if (typeof direct === 'string' && direct.length > 0) {
      return direct;
    }

    const match = Object.entries(properties).find(
      ([propertyKey]) => propertyKey.toLowerCase() === key.toLowerCase(),
    );

    if (match && typeof match[1] === 'string' && match[1].length > 0) {
      return match[1];
    }
  }

  return null;
}

/** Parses WHISP GeoJSON feature properties into cocoa risk metrics. */
export function parseWhispProperties(
  properties: Record<string, unknown>,
): Omit<WhispAnalysisResult, 'source'> {
  const whispRiskPcrop = readStringProperty(properties, [
    'Risk_PCrop',
    'risk_pcrop',
    'Risk_pcrop',
  ]);

  const lossPercent = readNumericProperty(properties, [
    'GFC_loss_after_2020_pct',
    'gfc_loss_after_2020_pct',
    'GFC_loss_after_2020',
    'loss_after_2020_pct',
  ]);

  const afforestationPercent = readNumericProperty(properties, [
    'umd_tree_cover_gain_pct',
    'ESRI_crop_gain_2023_pct',
    'tree_cover_gain_pct',
    'gain_pct',
  ]);

  return {
    whispRiskPcrop,
    lossPercent,
    afforestationPercent,
    rawProperties: properties,
  };
}

type WhispApiEnvelope<T> = {
  code?: string;
  message?: string;
  data?: T;
};

type WhispSubmitResponse = {
  token?: string;
};

type WhispStatusResponse = {
  status?: string;
  progress?: number;
};

/**
 * WhispClient submits farm polygons to Open Foris WHISP for EUDR cocoa risk analysis.
 */
@injectable()
export class WhispClient {
  /** Analyzes a farm polygon via WHISP async API or deterministic fallback. */
  async analyzePolygon(input: {
    farmId: string;
    geoJson: GeoJSON.Polygon;
    coordinates: GeoCoordinate[];
  }): Promise<WhispAnalysisResult> {
    if (!ENV.WHISP_API_KEY) {
      return buildFallbackWhisp(input.farmId, input.coordinates);
    }

    try {
      const featureCollection: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { farmId: input.farmId },
            geometry: input.geoJson,
          },
        ],
      };

      const submitResponse = await fetch(`${WHISP_BASE_URL}/submit/geojson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ENV.WHISP_API_KEY,
        },
        body: JSON.stringify({ geojson: featureCollection }),
      });

      if (!submitResponse.ok) {
        return buildFallbackWhisp(input.farmId, input.coordinates);
      }

      const submitPayload =
        (await submitResponse.json()) as WhispApiEnvelope<WhispSubmitResponse>;
      const token =
        submitPayload.data?.token ??
        (submitPayload as unknown as { token?: string }).token;

      if (!token) {
        return buildFallbackWhisp(input.farmId, input.coordinates);
      }

      const completed = await this.pollUntilComplete(token);

      if (!completed) {
        return buildFallbackWhisp(input.farmId, input.coordinates);
      }

      const geojsonResponse = await fetch(
        `${WHISP_BASE_URL}/generate-geojson/${token}`,
      );

      if (!geojsonResponse.ok) {
        return buildFallbackWhisp(input.farmId, input.coordinates);
      }

      const geojson = (await geojsonResponse.json()) as GeoJSON.FeatureCollection;
      const feature = geojson.features?.[0];
      const properties = (feature?.properties ?? {}) as Record<string, unknown>;
      const parsed = parseWhispProperties(properties);

      return {
        ...parsed,
        source: 'WHISP',
      };
    } catch {
      return buildFallbackWhisp(input.farmId, input.coordinates);
    }
  }

  private async pollUntilComplete(token: string): Promise<boolean> {
    const maxAttempts = ENV.WHISP_MAX_POLL_ATTEMPTS;
    const intervalMs = ENV.WHISP_POLL_MS;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const statusResponse = await fetch(`${WHISP_BASE_URL}/status/${token}`, {
        headers: { 'x-api-key': ENV.WHISP_API_KEY },
      });

      if (!statusResponse.ok) {
        return false;
      }

      const payload =
        (await statusResponse.json()) as WhispApiEnvelope<WhispStatusResponse>;
      const code = payload.code?.toLowerCase() ?? '';
      const status = payload.data?.status?.toLowerCase() ?? '';

      if (
        code.includes('completed') ||
        status === 'completed' ||
        status === 'complete'
      ) {
        return true;
      }

      if (code.includes('failed') || code.includes('error') || status === 'failed') {
        return false;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, intervalMs);
      });
    }

    return false;
  }
}
