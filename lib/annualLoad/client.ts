import type { AnnualLoadApiResponse, AnnualLoadRequestPayload } from "./types";

// Typical NSW household annual usage — only used if the browser can't even
// reach our own /api/annual-load route (e.g. offline), not a real estimate.
const OFFLINE_FALLBACK_KWH = 4000;

/**
 * Client-side wrapper around POST /api/annual-load. Mirrors the server's own
 * catch-and-fall-back behaviour for the one failure it can't catch itself:
 * the fetch never reaching it at all.
 */
export async function fetchAnnualLoad(payload: AnnualLoadRequestPayload): Promise<AnnualLoadApiResponse> {
  try {
    const res = await fetch("/api/annual-load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as AnnualLoadApiResponse;
  } catch (err) {
    return {
      ok: false,
      code: "API_ERROR",
      message: err instanceof Error ? err.message : "Network error",
      fallback: { estimatedAnnualUsageKwh: OFFLINE_FALLBACK_KWH, source: "fallback" },
    };
  }
}
