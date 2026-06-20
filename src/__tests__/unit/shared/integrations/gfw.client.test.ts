import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SAMPLE_COORDINATES = [
  { latitude: 6.6895, longitude: -1.6254 },
  { latitude: 6.6895, longitude: -1.6234 },
  { latitude: 6.6875, longitude: -1.6234 },
  { latitude: 6.6875, longitude: -1.6254 },
];

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

describe('GfwClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('@/shared/constants');
    vi.restoreAllMocks();
  });

  it('returns deterministic fallback metrics when no API key is configured', async () => {
    vi.doMock('@/shared/constants', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/shared/constants')>();
      return {
        ...actual,
        ENV: { ...actual.ENV, GFW_API_KEY: '' },
      };
    });

    const { GfwClient } = await import('@/shared/integrations/gfw.client');
    const client = new GfwClient();
    const result = await client.analyzePolygon({
      farmId: 'farm-ashanti',
      geoJson: SAMPLE_GEOJSON,
      coordinates: SAMPLE_COORDINATES,
    });

    expect(result.source).toBe('FALLBACK');
    expect(result.deforestationPercent).toBeGreaterThanOrEqual(0);
    expect(result.yearlyLoss).toHaveLength(5);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses GFW API responses when an API key is configured', async () => {
    vi.doMock('@/shared/constants', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/shared/constants')>();
      return {
        ...actual,
        ENV: { ...actual.ENV, GFW_API_KEY: 'test-key' },
      };
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'geostore-1' } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              { year: 2024, umd_tree_cover_loss__ha: 2, area__ha: 10 },
              { year: 2023, umd_tree_cover_loss__ha: 1, area__ha: 10 },
            ],
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ umd_tree_cover_gain__ha: 1 }],
          }),
      } as Response);

    const { GfwClient } = await import('@/shared/integrations/gfw.client');
    const client = new GfwClient();
    const result = await client.analyzePolygon({
      farmId: 'farm-api',
      geoJson: SAMPLE_GEOJSON,
      coordinates: SAMPLE_COORDINATES,
    });

    expect(result.source).toBe('GFW_WDPA');
    expect(result.deforestationPercent).toBe(15);
    expect(result.afforestationPercent).toBe(5);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
