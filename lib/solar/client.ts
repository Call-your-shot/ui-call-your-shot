import type { ScenarioId } from "@/lib/mockData";
import type { AnnualLoadRequestPayload } from "@/lib/annualLoad/types";
import { buildMockSolarResult } from "./mockFallback";
import type { SolarApiResponse } from "./types";

/**
 * Client-side wrapper around POST /api/solar. Mirrors the server's own
 * catch-and-fall-back-to-mock behaviour for the one class of failure the
 * server can't catch on its own: the fetch never reaching it at all
 * (offline, DNS failure, etc). The demo must never dead-end here either.
 */
export async function fetchSolarData(params: {
  address: string;
  scenario: ScenarioId;
  targetAnnualKwh?: number;
  /** The full form collected across scan + household — carried along so
   * the request isn't limited to just the derived target number. */
  formData?: AnnualLoadRequestPayload;
  forceMock?: boolean;
}): Promise<SolarApiResponse> {
  try {
    const res = await fetch("/api/solar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: params.address,
        scenario: params.scenario,
        targetAnnualKwh: params.targetAnnualKwh,
        formData: params.formData,
        mock: params.forceMock,
      }),
    });
    return (await res.json()) as SolarApiResponse;
  } catch (err) {
    return {
      ok: false,
      code: "API_ERROR",
      message: err instanceof Error ? err.message : "Network error",
      fallback: buildMockSolarResult(params.scenario),
    };
  }
}
