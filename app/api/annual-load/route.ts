import { NextRequest, NextResponse } from "next/server";
import { estimateAnnualUsage } from "@/lib/consumption/estimate";
import type { AnnualLoadApiResponse, AnnualLoadRequestPayload, AnnualLoadResult } from "@/lib/annualLoad/types";

const MIN_ANNUAL_KWH = 500;
const ANNUAL_LOAD_PATH = "/api/v1/analytics/estimate-annual-load";

function localFallback(payload: AnnualLoadRequestPayload): AnnualLoadResult {
  const estimate = estimateAnnualUsage({
    billUsageKwh: payload.billUsageKwh,
    billingPeriodStart: payload.billingPeriodStart,
    billingPeriodEnd: payload.billingPeriodEnd,
    billTotalCostDollars: payload.billTotalCostDollars,
    heatingNotUsedThisMonth: payload.heatingNotUsedThisMonth,
    heatingHours: payload.heatingHours,
    coolingNotUsedThisMonth: payload.coolingNotUsedThisMonth,
    coolingHours: payload.coolingHours,
    poolNotUsedThisMonth: payload.poolNotUsedThisMonth,
    poolHours: payload.poolHours,
    evNotUsedThisMonth: payload.evNotUsedThisMonth,
    evHours: payload.evHours,
    hotWaterNotUsedThisMonth: payload.hotWaterNotUsedThisMonth,
    hotWaterHours: payload.hotWaterHours,
  });
  return {
    estimatedAnnualUsageKwh: Math.max(MIN_ANNUAL_KWH, estimate.annualKwh),
    source: "fallback",
  };
}

export async function POST(req: NextRequest) {
  let payload: AnnualLoadRequestPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json<AnnualLoadApiResponse>(
      {
        ok: false,
        code: "API_ERROR",
        message: "Malformed request body",
        fallback: { estimatedAnnualUsageKwh: MIN_ANNUAL_KWH, source: "fallback" },
      },
      { status: 400 }
    );
  }

  // BACKEND_URL is the analytics service's base (e.g. http://localhost:8001);
  // ANNUAL_LOAD_PATH above is the specific route on it. Takes
  // { formData: <the fields below> } and returns
  // { estimated_annual_usage_kwh: number }. If it's unset or fails, the
  // estimate is derived locally so the rest of the flow (Google Solar panel
  // fitting, which already sizes off an annual kWh target) keeps working.
  const backendBaseUrl = process.env.BACKEND_URL;

  if (!backendBaseUrl) {
    return NextResponse.json<AnnualLoadApiResponse>({ ok: true, result: localFallback(payload) });
  }

  try {
    const url = `${backendBaseUrl}${ANNUAL_LOAD_PATH}`;
    console.log(`[api/annual-load] calling backend: POST ${url}`);
    // The backend expects the form wrapped under a `formData` key, not the
    // bare fields — confirmed against the real endpoint.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData: payload }),
    });
    if (!res.ok) {
      throw new Error(`Annual load backend responded ${res.status}`);
    }
    const data = await res.json();
    const estimatedAnnualUsageKwh = Number(data?.estimated_annual_usage_kwh);
    if (!Number.isFinite(estimatedAnnualUsageKwh) || estimatedAnnualUsageKwh <= 0) {
      throw new Error("Annual load backend returned no usable estimated_annual_usage_kwh");
    }
    console.log(`[api/annual-load] backend responded: estimated_annual_usage_kwh=${estimatedAnnualUsageKwh}`);
    return NextResponse.json<AnnualLoadApiResponse>({
      ok: true,
      result: { estimatedAnnualUsageKwh, source: "backend" },
    });
  } catch (err) {
    console.error("[api/annual-load] backend call failed, using local fallback:", err);
    return NextResponse.json<AnnualLoadApiResponse>({
      ok: false,
      code: "API_ERROR",
      message: err instanceof Error ? err.message : "Unknown error",
      fallback: localFallback(payload),
    });
  }
}
