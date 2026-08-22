import { NextRequest, NextResponse } from "next/server";
import { getCached, setCached } from "@/lib/solar/cache";
import { fetchBuildingInsightsWithCascade, geocodeAddress } from "@/lib/solar/googleClient";
import { buildMockSolarResult } from "@/lib/solar/mockFallback";
import { normalizeBuildingInsights } from "@/lib/solar/normalize";
import type { ScenarioId } from "@/lib/mockData";
import type { SolarApiResponse } from "@/lib/solar/types";
import type { AnnualLoadRequestPayload } from "@/lib/annualLoad/types";

const DEFAULT_TARGET_ANNUAL_KWH = 5000;

interface SolarRequestBody {
  address?: string;
  targetAnnualKwh?: number;
  /** The full form collected across scan + household — same shape sent to
   * /api/annual-load. Google's Solar API itself only needs the address and
   * a target annual usage, so this rides along unused for now; it's here so
   * the request carries full context for logging/debugging. */
  formData?: AnnualLoadRequestPayload;
  /** Which mock scenario to fall back to — the flow only ever has two. */
  scenario?: ScenarioId;
  mock?: boolean;
}

function mockResultForAddress(scenarioId: ScenarioId, address?: string) {
  const result = buildMockSolarResult(scenarioId);
  const formattedAddress = address?.trim();
  return formattedAddress ? { ...result, formattedAddress } : result;
}

export async function POST(req: NextRequest) {
  let body: SolarRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<SolarApiResponse>(
      { ok: false, code: "API_ERROR", message: "Malformed request body" },
      { status: 400 }
    );
  }

  const scenarioId: ScenarioId = body.scenario ?? "bellambi";
  const targetAnnualKwh = body.targetAnnualKwh ?? DEFAULT_TARGET_ANNUAL_KWH;
  const forceMock = body.mock === true || req.nextUrl.searchParams.get("mock") === "1";

  if (body.formData) {
    console.log("[api/solar] full household form data:", JSON.stringify(body.formData));
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (forceMock || !apiKey) {
    return NextResponse.json<SolarApiResponse>({
      ok: true,
      result: mockResultForAddress(scenarioId, body.address),
    });
  }

  if (!body.address) {
    return NextResponse.json<SolarApiResponse>(
      { ok: false, code: "API_ERROR", message: "Missing address" },
      { status: 400 }
    );
  }

  try {
    const geocoded = await geocodeAddress(body.address, apiKey);
    if (!geocoded) {
      return NextResponse.json<SolarApiResponse>({
        ok: false,
        code: "GEOCODE_FAILED",
        message: "We couldn't find that address. Check it and try again.",
      });
    }

    const cached = getCached(geocoded.lat, geocoded.lng);
    const cascade = cached ?? (await fetchBuildingInsightsWithCascade(geocoded.lat, geocoded.lng, apiKey));
    if (!cascade) {
      return NextResponse.json<SolarApiResponse>({
        ok: false,
        code: "NO_COVERAGE",
        message: "Detailed roof data isn't available for this address yet.",
      });
    }
    if (!cached) {
      setCached(geocoded.lat, geocoded.lng, cascade);
    }

    const result = normalizeBuildingInsights(
      cascade.response,
      cascade.quality,
      geocoded.formattedAddress,
      targetAnnualKwh
    );

    return NextResponse.json<SolarApiResponse>({ ok: true, result });
  } catch (err) {
    // Network failure, quota exceeded, malformed response, etc. — never let
    // the demo dead-end here, degrade to clearly-labelled mock data.
    console.error("[api/solar] falling back to mock data:", err);
    return NextResponse.json<SolarApiResponse>({
      ok: false,
      code: "API_ERROR",
      message: err instanceof Error ? err.message : "Unknown error",
      fallback: mockResultForAddress(scenarioId, body.address),
    });
  }
}
