import type { BuildingInsightsResponse, ImageryQuality } from "./types";

const QUALITY_CASCADE: ImageryQuality[] = ["HIGH", "MEDIUM", "BASE"];

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

/**
 * Step 1 — address to coordinates. Returns null only when Google genuinely
 * found no match for the address (ZERO_RESULTS) — that's a case the user
 * can fix by editing their input. Anything else (bad key, unenabled API,
 * quota, request malformed) throws instead, since retrying the same
 * address won't help; the route handler treats that as an API_ERROR and
 * falls back to mock data rather than telling the user their address is
 * wrong when it isn't.
 */
export async function geocodeAddress(
  address: string,
  apiKey: string
): Promise<GeocodeResult | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("region", "au");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Geocoding request failed: ${res.status}`);
  }
  const data = await res.json();

  if (data.status === "ZERO_RESULTS") {
    return null;
  }
  if (data.status !== "OK" || !data.results?.length) {
    throw new Error(
      `Geocoding error: ${data.status}${data.error_message ? ` — ${data.error_message}` : ""}`
    );
  }

  const first = data.results[0];
  return {
    lat: first.geometry.location.lat,
    lng: first.geometry.location.lng,
    formattedAddress: first.formatted_address,
  };
}

/** Step 2 — a single buildingInsights call at one quality tier. Returns
 * null specifically on NOT_FOUND (no coverage at this tier / this location)
 * so the caller can cascade; throws on genuine errors (auth, quota, etc). */
async function fetchBuildingInsightsAtQuality(
  lat: number,
  lng: number,
  quality: ImageryQuality,
  apiKey: string
): Promise<BuildingInsightsResponse | null> {
  const url = new URL("https://solar.googleapis.com/v1/buildingInsights:findClosest");
  url.searchParams.set("location.latitude", String(lat));
  url.searchParams.set("location.longitude", String(lng));
  url.searchParams.set("requiredQuality", quality);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Solar API request failed: ${res.status} ${body}`.trim());
  }
  return (await res.json()) as BuildingInsightsResponse;
}

export interface BuildingInsightsCascadeResult {
  response: BuildingInsightsResponse;
  quality: ImageryQuality;
}

/**
 * Step 2, with the quality cascade Australian coverage needs: try HIGH,
 * fall back to MEDIUM, then BASE. Returns null (not an error) if all three
 * tiers come back NOT_FOUND — that's a legitimate "no coverage here"
 * result, not a failure of the call itself.
 */
export async function fetchBuildingInsightsWithCascade(
  lat: number,
  lng: number,
  apiKey: string
): Promise<BuildingInsightsCascadeResult | null> {
  for (const quality of QUALITY_CASCADE) {
    const response = await fetchBuildingInsightsAtQuality(lat, lng, quality, apiKey);
    if (response) {
      return { response, quality };
    }
  }
  return null;
}
