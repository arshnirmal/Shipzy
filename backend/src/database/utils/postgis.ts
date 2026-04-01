// services/backend/src/database/utils/postgis.ts
// PostGIS helper functions using Drizzle sql helper

import { sql } from "drizzle-orm";

/**
 * Create a PostGIS point from latitude and longitude
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns SQL fragment for PostGIS point
 */
export const createPoint = (lat: number, lng: number) => {
  return sql<{ lat: number; lng: number }>`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
};

/**
 * Calculate distance between two PostGIS points in kilometers
 * @param point1 - First point (SQL fragment or column reference)
 * @param point2 - Second point (SQL fragment or column reference)
 * @returns SQL fragment for distance in kilometers
 */
export const distance = (
  point1: ReturnType<typeof sql>,
  point2: ReturnType<typeof sql>,
) => {
  return sql<number>`ST_Distance(${point1}, ${point2}) / 1000.0`;
};

/**
 * Check if a point is within a radius (in kilometers) of a center point
 * @param center - Center point (SQL fragment or column reference)
 * @param point - Point to check (SQL fragment or column reference)
 * @param radiusKm - Radius in kilometers
 * @returns SQL fragment for boolean result
 */
export const withinRadius = (
  center: ReturnType<typeof sql>,
  point: ReturnType<typeof sql>,
  radiusKm: number,
) => {
  return sql<boolean>`ST_DWithin(${center}, ${point}, ${radiusKm * 1000.0})`;
};

/**
 * Extract latitude from a PostGIS geography point
 * @param point - PostGIS point (SQL fragment or column reference)
 * @returns SQL fragment for latitude
 */
export const extractLatitude = (point: ReturnType<typeof sql>) => {
  return sql<number>`ST_Y(${point}::geometry)`;
};

/**
 * Extract longitude from a PostGIS geography point
 * @param point - PostGIS point (SQL fragment or column reference)
 * @returns SQL fragment for longitude
 */
export const extractLongitude = (point: ReturnType<typeof sql>) => {
  return sql<number>`ST_X(${point}::geometry)`;
};

/**
 * Find nearby points within a radius
 * @param centerLat - Center latitude
 * @param centerLng - Center longitude
 * @param radiusKm - Radius in kilometers
 * @param pointColumn - Column reference for the point to check
 * @returns SQL fragment for boolean result
 */
export const findNearby = (
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  pointColumn: ReturnType<typeof sql>,
) => {
  const center = createPoint(centerLat, centerLng);
  return withinRadius(center, pointColumn, radiusKm);
};

export default {
  createPoint,
  distance,
  withinRadius,
  extractLatitude,
  extractLongitude,
  findNearby,
};
