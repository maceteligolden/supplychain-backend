import area from '@turf/area';
import centroid from '@turf/centroid';
import { polygon } from '@turf/helpers';

const SQUARE_METRES_PER_HECTARE = 10_000;

export type GeoCoordinate = {
  latitude: number;
  longitude: number;
};

/** Closes an open coordinate ring by appending the first vertex if needed. */
export function closeCoordinateRing(coordinates: GeoCoordinate[]): GeoCoordinate[] {
  if (coordinates.length < 3) {
    return coordinates;
  }

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  if (!first || !last) {
    return coordinates;
  }

  if (first.latitude === last.latitude && first.longitude === last.longitude) {
    return coordinates;
  }

  return [...coordinates, first];
}

/** Computes geodesic polygon area in hectares from latitude/longitude vertices. */
export function calculatePolygonAreaHectares(coordinates: GeoCoordinate[]): number {
  const closed = closeCoordinateRing(coordinates);

  if (closed.length < 4) {
    return 0;
  }

  const ring = closed.map(
    (coord) => [coord.longitude, coord.latitude] as [number, number],
  );

  const feature = polygon([ring]);
  const squareMetres = area(feature);

  return Math.round((squareMetres / SQUARE_METRES_PER_HECTARE) * 100) / 100;
}

/** Converts stored coordinates to GeoJSON polygon (lon/lat order). */
export function coordinatesToGeoJsonPolygon(
  coordinates: GeoCoordinate[],
): GeoJSON.Polygon {
  const closed = closeCoordinateRing(coordinates);
  const ring = closed.map(
    (coord) => [coord.longitude, coord.latitude] as [number, number],
  );

  return {
    type: 'Polygon',
    coordinates: [ring],
  };
}

/** Returns centroid latitude/longitude for a polygon. */
export function polygonCentroid(coordinates: GeoCoordinate[]): GeoCoordinate {
  const geoJson = coordinatesToGeoJsonPolygon(coordinates);
  const center = centroid({ type: 'Feature', properties: {}, geometry: geoJson });
  const [longitude, latitude] = center.geometry.coordinates as [number, number];

  return { latitude, longitude };
}
