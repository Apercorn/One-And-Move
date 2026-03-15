/**
 * OSRM utility — shared road-geometry & travel-time helpers.
 *
 * Uses the public OSRM demo server (`router.project-osrm.org`).
 * Walking legs use haversine estimation (the demo server only supports driving).
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteGeometryResult {
  /** Travel distance in metres */
  distanceMetres: number;
  /** Travel duration in seconds */
  durationSeconds: number;
  /** Road-snapped coordinates */
  geometry: LatLng[];
}

/* ── Constants ──────────────────────────────────── */

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;
const WALK_SPEED_KMH = 5;
/** Multiply straight-line distance by this to approximate road distance */
const ROAD_FACTOR = 1.4;

/* ── Haversine ──────────────────────────────────── */

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = (b.lat - a.lat) * DEG_TO_RAD;
  const dLng = (b.lng - a.lng) * DEG_TO_RAD;
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLng = Math.sin(dLng / 2);
  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(a.lat * DEG_TO_RAD) *
    Math.cos(b.lat * DEG_TO_RAD) *
    sinHalfLng *
    sinHalfLng;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/* ── Walking estimate (road-snapped via OSRM driving geometry) ── */

/**
 * Get road-snapped walk geometry by using OSRM driving profile
 * (the public demo server doesn't support walking profile).
 * We use the driving geometry for the road shape, then recalculate
 * duration at walking speed (5 km/h) for a realistic time estimate.
 */
export async function estimateWalk(
  from: LatLng,
  to: LatLng
): Promise<RouteGeometryResult> {
  const straightKm = haversineKm(from, to);

  // For very short distances (<100m), use straight line
  if (straightKm < 0.1) {
    const roadKm = straightKm * ROAD_FACTOR;
    return {
      geometry: [from, to],
      distanceMetres: roadKm * 1000,
      durationSeconds: (roadKm / WALK_SPEED_KMH) * 3600,
    };
  }

  // Use OSRM driving profile to get road-snapped geometry
  const drivingResult = await fetchDrivingRoute([from, to]);

  // Recalculate duration at walking speed instead of driving speed
  const distKm = drivingResult.distanceMetres / 1000;
  const walkDuration = (distKm / WALK_SPEED_KMH) * 3600;

  return {
    geometry: drivingResult.geometry,
    distanceMetres: drivingResult.distanceMetres,
    durationSeconds: walkDuration,
  };
}

/* ── OSRM driving route ─────────────────────────── */

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function sampleEvenly<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  const result: T[] = [arr[0] as T];
  const step = (arr.length - 1) / (n - 1);
  for (let i = 1; i < n - 1; i++) {
    result.push(arr[Math.round(i * step)] as T);
  }
  result.push(arr[arr.length - 1] as T);
  return result;
}

/**
 * Fetch road-snapped geometry from the public OSRM demo server.
 *
 * Returns driving route geometry + distance + duration.
 * Falls back to straight-line if the server is unreachable.
 */
export async function fetchDrivingRoute(
  waypoints: LatLng[],
  attempt = 0
): Promise<RouteGeometryResult> {
  if (waypoints.length < 2) {
    return {
      geometry: waypoints,
      distanceMetres: 0,
      durationSeconds: 0,
    };
  }

  // OSRM demo server caps at ~25 waypoints
  const sampled =
    waypoints.length > 25 ? sampleEvenly(waypoints, 25) : waypoints;
  const coordStr = sampled.map((c) => `${c.lng},${c.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });

    if (res.status === 429 && attempt === 0) {
      await sleep(2000 + Math.random() * 1000);
      return fetchDrivingRoute(waypoints, 1);
    }

    if (!res.ok) {
      return fallback(waypoints);
    }

    const json = (await res.json()) as {
      routes?: Array<{
        geometry?: { coordinates?: [number, number][] };
        distance?: number;
        duration?: number;
      }>;
    };
    const route = json?.routes?.[0];
    const coords = route?.geometry?.coordinates;

    if (!Array.isArray(coords) || coords.length < 2) {
      return fallback(waypoints);
    }

    return {
      geometry: coords.map(([lng, lat]: [number, number]) => ({ lat, lng })),
      distanceMetres: route?.distance ?? 0,
      durationSeconds: route?.duration ?? 0,
    };
  } catch {
    return fallback(waypoints);
  }
}

/** Straight-line fallback when OSRM is unavailable */
function fallback(waypoints: LatLng[]): RouteGeometryResult {
  let totalKm = 0;
  for (let i = 1; i < waypoints.length; i++) {
    totalKm += haversineKm(waypoints[i - 1] as LatLng, waypoints[i] as LatLng);
  }
  // Estimate 30 km/h average driving speed
  const durationSeconds = (totalKm / 30) * 3600;
  return {
    geometry: waypoints,
    distanceMetres: totalKm * 1000,
    durationSeconds,
  };
}
