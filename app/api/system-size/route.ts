import { NextRequest, NextResponse } from "next/server";
import { estimateAnnualUsage } from "@/lib/consumption/estimate";
import type { SystemSizeApiResponse, SystemSizeRequestPayload, SystemSizeResult } from "@/lib/systemSize/types";

// Rough Illawarra-region rule of thumb — same constant used in
// lib/solar/manualEstimate.ts for the no-coverage manual path.
const ASSUMED_KWH_PER_KW_PER_YEAR = 1400;
const MIN_SYSTEM_SIZE_KW = 1.5;

function localFallback(payload: SystemSizeRequestPayload): SystemSizeResult {
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
  const systemSizeKw = Math.max(
    MIN_SYSTEM_SIZE_KW,
    Math.round((estimate.annualKwh / ASSUMED_KWH_PER_KW_PER_YEAR) * 10) / 10
  );
  return { systemSizeKw, source: "fallback" };
}

export async function POST(req: NextRequest) {
  let payload: SystemSizeRequestPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json<SystemSizeApiResponse>(
      { ok: false, code: "API_ERROR", message: "Malformed request body", fallback: { systemSizeKw: MIN_SYSTEM_SIZE_KW, source: "fallback" } },
      { status: 400 }
    );
  }

  // Sizing backend URL + route are still TBD — set SYSTEM_SIZE_API_URL once
  // it exists (e.g. https://api.example.com/v1/size-system). Until then we
  // size locally so the rest of the flow (Google Solar panel fitting) keeps
  // working end-to-end.
  const backendUrl = process.env.SYSTEM_SIZE_API_URL;

  if (!backendUrl) {
    return NextResponse.json<SystemSizeApiResponse>({ ok: true, result: localFallback(payload) });
  }

  try {
    const res = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Sizing backend responded ${res.status}`);
    }
    const data = await res.json();
    const systemSizeKw = Number(data?.systemSizeKw);
    if (!Number.isFinite(systemSizeKw) || systemSizeKw <= 0) {
      throw new Error("Sizing backend returned no usable systemSizeKw");
    }
    return NextResponse.json<SystemSizeApiResponse>({
      ok: true,
      result: { systemSizeKw, source: "backend" },
    });
  } catch (err) {
    console.error("[api/system-size] backend call failed, using local fallback:", err);
    return NextResponse.json<SystemSizeApiResponse>({
      ok: false,
      code: "API_ERROR",
      message: err instanceof Error ? err.message : "Unknown error",
      fallback: localFallback(payload),
    });
  }
}
