import type { SolarResult } from "./types";

// ---------------------------------------------------------------------------
// In-memory cache, keyed by rounded coordinates.
//
// Google's terms require cached Solar API data to be refreshed at least
// every 30 days; we use 7 as a comfortable margin. This is a module-level
// Map, so it lives for the lifetime of the Node process — fine for a single
// long-running server (e.g. `next start`, or `next dev`), but it resets on
// every cold start in a serverless deployment. A production deployment on
// Vercel or similar would want this backed by Redis/KV instead; the
// interface below is deliberately small so swapping the implementation
// later doesn't touch any call sites.
// ---------------------------------------------------------------------------

const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const COORD_PRECISION = 5;

interface CacheEntry {
  result: SolarResult;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

export function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(COORD_PRECISION)},${lng.toFixed(COORD_PRECISION)}`;
}

export function getCached(lat: number, lng: number): SolarResult | undefined {
  const entry = store.get(cacheKey(lat, lng));
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(cacheKey(lat, lng));
    return undefined;
  }
  return entry.result;
}

export function setCached(lat: number, lng: number, result: SolarResult): void {
  store.set(cacheKey(lat, lng), { result, expiresAt: Date.now() + TTL_MS });
}

/** Test/ops escape hatch — not used by the route handler itself. */
export function clearCache(): void {
  store.clear();
}
