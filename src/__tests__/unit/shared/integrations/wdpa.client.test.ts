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

describe('WdpaClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('@/shared/constants');
    vi.restoreAllMocks();
  });

  it('returns heuristic overlap when no API token is configured', async () => {
    vi.doMock('@/shared/constants', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/shared/constants')>();
      return {
        ...actual,
        ENV: { ...actual.ENV, WDPA_API_TOKEN: '' },
      };
    });

    const { WdpaClient } = await import('@/shared/integrations/wdpa.client');
    const client = new WdpaClient();
    const result = await client.analyzeProtectedAreas({
      geoJson: SAMPLE_GEOJSON,
      farmId: 'farm-ashanti',
      centroidLatitude: 6.6885,
      farmAreaHectares: 4.91,
    });

    expect(result.protectedAreaOverlapPercent).toBeGreaterThanOrEqual(0);
    expect(result.source).toBe('FALLBACK');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('computes overlap when WDPA search returns intersecting geometries', async () => {
    vi.doMock('@/shared/constants', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/shared/constants')>();
      return {
        ...actual,
        ENV: { ...actual.ENV, WDPA_API_TOKEN: 'test-token' },
      };
    });

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

    const { WdpaClient } = await import('@/shared/integrations/wdpa.client');
    const client = new WdpaClient();
    const result = await client.analyzeProtectedAreas({
      geoJson: SAMPLE_GEOJSON,
      farmId: 'farm-api',
      centroidLatitude: 6.6885,
      farmAreaHectares: 4.91,
    });

    expect(result.protectedAreaDetected).toBe(true);
    expect(result.protectedAreaOverlapPercent).toBe(100);
    expect(result.protectedAreas.features).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
