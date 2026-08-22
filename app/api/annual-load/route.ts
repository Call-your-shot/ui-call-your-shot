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
  const annualKwh = Math.max(MIN_ANNUAL_KWH, estimate.annualKwh);
  const seasonal = [
    estimate.seasonalKwh.summer / 3,
    estimate.seasonalKwh.summer / 3,
    estimate.seasonalKwh.autumn / 3,
    estimate.seasonalKwh.autumn / 3,
    estimate.seasonalKwh.autumn / 3,
    estimate.seasonalKwh.winter / 3,
    estimate.seasonalKwh.winter / 3,
    estimate.seasonalKwh.winter / 3,
    estimate.seasonalKwh.spring / 3,
    estimate.seasonalKwh.spring / 3,
    estimate.seasonalKwh.spring / 3,
    estimate.seasonalKwh.summer / 3,
  ];
  const scale = annualKwh / seasonal.reduce((sum, value) => sum + value, 0);
  const daytimeUsageRatio = payload.homeDuringDay === "most" ? 0.55 : payload.homeDuringDay === "rarely" ? 0.25 : 0.4;
  return {
    estimatedAnnualUsageKwh: annualKwh,
    monthlyUsage: seasonal.map((usageKwh, index) => ({
      calendarMonth: index + 1,
      monthName: new Date(2025, index, 1).toLocaleString("en-AU", { month: "long" }),
      usageKwh: Math.round(usageKwh * scale * 10) / 10,
      daytimeUsageRatio,
      source: "survey_derived" as const,
    })),
    observedMonthCount: 1,
    profileSource: "single_bill_and_survey",
    dataQuality: "low",
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
        fallback: localFallback({
          address: "", billUsageKwh: MIN_ANNUAL_KWH / 12, billingPeriodStart: "2026-01-01",
          billingPeriodEnd: "2026-02-01", billTotalCostDollars: null, homeDuringDay: null,
          occupantCount: 1, heatingNotUsedThisMonth: false, heatingHours: null,
          coolingNotUsedThisMonth: false, coolingHours: null, poolNotUsedThisMonth: false,
          poolHours: null, evNotUsedThisMonth: false, evHours: null,
          hotWaterNotUsedThisMonth: false, hotWaterHours: null,
        }),
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
    const monthlyUsage = Array.isArray(data?.monthly_usage)
      ? data.monthly_usage.map((item: Record<string, unknown>) => ({
          calendarMonth: Number(item.calendar_month),
          monthName: String(item.month_name),
          usageKwh: Number(item.usage_kwh),
          daytimeUsageRatio: Number(item.daytime_usage_ratio),
          source: item.source as AnnualLoadResult["monthlyUsage"][number]["source"],
        }))
      : [];
    if (monthlyUsage.length !== 12) throw new Error("Annual load backend returned no 12-month profile");
    console.log(`[api/annual-load] backend responded: estimated_annual_usage_kwh=${estimatedAnnualUsageKwh}`);
    return NextResponse.json<AnnualLoadApiResponse>({
      ok: true,
      result: {
        estimatedAnnualUsageKwh,
        monthlyUsage,
        observedMonthCount: Number(data.observed_month_count ?? 1),
        profileSource: data.profile_source,
        dataQuality: data.data_quality,
        source: "backend",
      },
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
