import type { BuildingInsightsCascadeResult } from "./googleClient";

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
//
// Caches the raw building-insights response, not the derived SolarResult —
// the derivation depends on the household's target usage/system size, which
// varies per request even for the same address, so it has to be re-run on
// every request rather than baked into the cached entry.
// ---------------------------------------------------------------------------

const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const COORD_PRECISION = 5;

interface CacheEntry {
  cascade: BuildingInsightsCascadeResult;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

export function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(COORD_PRECISION)},${lng.toFixed(COORD_PRECISION)}`;
}

export function getCached(lat: number, lng: number): BuildingInsightsCascadeResult | undefined {
  const entry = store.get(cacheKey(lat, lng));
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(cacheKey(lat, lng));
    return undefined;
  }
  return entry.cascade;
}

export function setCached(lat: number, lng: number, cascade: BuildingInsightsCascadeResult): void {
  store.set(cacheKey(lat, lng), { cascade, expiresAt: Date.now() + TTL_MS });
}

/** Test/ops escape hatch — not used by the route handler itself. */
export function clearCache(): void {
  store.clear();
}
