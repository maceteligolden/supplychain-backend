import { describe, expect, it } from 'vitest';

import {
  calculatePolygonAreaHectares,
  closeCoordinateRing,
  coordinatesToGeoJsonPolygon,
} from '@/shared/utils/polygon.util';

const SAMPLE_SQUARE = [
  { latitude: 6.6895, longitude: -1.6254 },
  { latitude: 6.6895, longitude: -1.6234 },
  { latitude: 6.6875, longitude: -1.6234 },
  { latitude: 6.6875, longitude: -1.6254 },
];

describe('polygon.util', () => {
  it('closes an open ring by repeating the first vertex', () => {
    const closed = closeCoordinateRing(SAMPLE_SQUARE);

    expect(closed).toHaveLength(5);
    expect(closed[4]).toEqual(SAMPLE_SQUARE[0]);
  });

  it('computes a positive area in hectares for a valid polygon', () => {
    const area = calculatePolygonAreaHectares(SAMPLE_SQUARE);

    expect(area).toBeGreaterThan(0);
    expect(area).toBeLessThan(10);
  });

  it('returns zero area when fewer than three vertices are provided', () => {
    expect(calculatePolygonAreaHectares(SAMPLE_SQUARE.slice(0, 2))).toBe(0);
  });

  it('converts coordinates to GeoJSON with lon/lat order', () => {
    const geoJson = coordinatesToGeoJsonPolygon(SAMPLE_SQUARE);

    expect(geoJson.type).toBe('Polygon');
    expect(geoJson.coordinates[0]?.[0]).toEqual([-1.6254, 6.6895]);
  });
});
