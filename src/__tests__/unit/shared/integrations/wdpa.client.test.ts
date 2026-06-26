import area from '@turf/area';
import { feature } from '@turf/helpers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SAMPLE_GEOJSON: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [-1.6254, 6.6895],
      [-1.6234, 6.6895],
      [-1.6234, 6.6875],
      [-1.6254, 6.6875],
      [-1.6254, 6.6895],
    ],
  ],
};

const SAMPLE_FARM_AREA_HECTARES = area(feature(SAMPLE_GEOJSON)) / 10_000;

async function loadWdpaClient(): Promise<
  typeof import('@/shared/integrations/wdpa.client')
> {
  return import('@/shared/integrations/wdpa.client');
}

describe('WdpaClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('returns heuristic overlap when no API token is configured', async () => {
    vi.stubEnv('WDPA_API_TOKEN', '');
    vi.resetModules();

    const { WdpaClient } = await loadWdpaClient();
    const client = new WdpaClient();
    const result = await client.analyzeProtectedAreas({
      geoJson: SAMPLE_GEOJSON,
      farmId: 'farm-ashanti',
      centroidLatitude: 6.6885,
      farmAreaHectares: SAMPLE_FARM_AREA_HECTARES,
    });

    expect(result.protectedAreaOverlapPercent).toBeGreaterThanOrEqual(0);
    expect(result.source).toBe('FALLBACK');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('computes overlap when WDPA search returns intersecting geometries', async () => {
    vi.stubEnv('WDPA_API_TOKEN', 'test-token');
    vi.resetModules();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [
            {
              id: 1,
              name: 'Test Reserve',
              geometry: SAMPLE_GEOJSON,
            },
          ],
        }),
    } as Response);

    const { WdpaClient } = await loadWdpaClient();
    const client = new WdpaClient();
    const result = await client.analyzeProtectedAreas({
      geoJson: SAMPLE_GEOJSON,
      farmId: 'farm-api',
      centroidLatitude: 6.6885,
      farmAreaHectares: SAMPLE_FARM_AREA_HECTARES,
    });

    expect(result.protectedAreaDetected).toBe(true);
    expect(result.protectedAreaOverlapPercent).toBe(100);
    expect(result.protectedAreas.features).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
