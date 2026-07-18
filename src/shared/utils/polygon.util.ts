import area from '@turf/area';
import bbox from '@turf/bbox';
import centroid from '@turf/centroid';
import { multiPolygon, polygon } from '@turf/helpers';

const SQUARE_METRES_PER_HECTARE = 10_000;

export const MAX_BOUNDARY_PLOTS = 20;
export const MIN_RING_VERTICES = 3;
export const MAX_RING_VERTICES = 500;

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

function ringToLonLat(coordinates: GeoCoordinate[]): [number, number][] {
  return closeCoordinateRing(coordinates).map(
    (coord) => [coord.longitude, coord.latitude] as [number, number],
  );
}

/** Normalizes legacy flat coordinates or plots into a non-empty plots array. */
export function normalizeBoundaryPlots(
  coordinates: GeoCoordinate[],
  plots?: GeoCoordinate[][],
): GeoCoordinate[][] {
  if (plots && plots.length > 0) {
    return plots;
  }

  if (coordinates.length >= MIN_RING_VERTICES) {
    return [coordinates];
  }

  return [];
}

/** Computes geodesic area in hectares for one or more plot rings. */
export function calculatePolygonAreaHectares(
  coordinatesOrPlots: GeoCoordinate[] | GeoCoordinate[][],
): number {
  const plots = Array.isArray(coordinatesOrPlots[0])
    ? (coordinatesOrPlots as GeoCoordinate[][])
    : [coordinatesOrPlots as GeoCoordinate[]];

  let totalSquareMetres = 0;

  for (const plot of plots) {
    const closed = closeCoordinateRing(plot);

    if (closed.length < 4) {
      continue;
    }

    const feature = polygon([ringToLonLat(plot)]);
    totalSquareMetres += area(feature);
  }

  return Math.round((totalSquareMetres / SQUARE_METRES_PER_HECTARE) * 100) / 100;
}

/** Converts stored plots to GeoJSON Polygon or MultiPolygon (lon/lat order). */
export function coordinatesToGeoJsonPolygon(
  coordinatesOrPlots: GeoCoordinate[] | GeoCoordinate[][],
): GeoJSON.Polygon | GeoJSON.MultiPolygon {
  const plots = Array.isArray(coordinatesOrPlots[0])
    ? (coordinatesOrPlots as GeoCoordinate[][])
    : [coordinatesOrPlots as GeoCoordinate[]];

  const rings = plots
    .filter((plot) => plot.length >= MIN_RING_VERTICES)
    .map((plot) => [ringToLonLat(plot)]);

  if (rings.length === 0) {
    return { type: 'Polygon', coordinates: [] };
  }

  if (rings.length === 1) {
    return {
      type: 'Polygon',
      coordinates: rings[0] ?? [],
    };
  }

  return {
    type: 'MultiPolygon',
    coordinates: rings,
  };
}

/** Returns centroid latitude/longitude for the first plot (or multipolygon). */
export function polygonCentroid(
  coordinatesOrPlots: GeoCoordinate[] | GeoCoordinate[][],
): GeoCoordinate {
  const geoJson = coordinatesToGeoJsonPolygon(coordinatesOrPlots);
  const feature =
    geoJson.type === 'MultiPolygon'
      ? multiPolygon(geoJson.coordinates)
      : polygon(geoJson.coordinates);
  const center = centroid(feature);
  const [longitude, latitude] = center.geometry.coordinates as [number, number];

  return { latitude, longitude };
}

/** Bounding box [minLng, minLat, maxLng, maxLat] for plot rings. */
export function plotsBoundingBox(
  plots: GeoCoordinate[][],
): [number, number, number, number] {
  const geoJson = coordinatesToGeoJsonPolygon(plots);
  const feature =
    geoJson.type === 'MultiPolygon'
      ? multiPolygon(geoJson.coordinates)
      : polygon(geoJson.coordinates);

  return bbox(feature) as [number, number, number, number];
}
