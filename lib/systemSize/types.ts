import type { HoursBucket } from "@/lib/consumption/types";

// ---------------------------------------------------------------------------
// The JSON payload we hand to the sizing backend, and the shape it hands
// back. The backend owns the actual sizing logic — everything here is just
// the form data collected across scan + household, serialized as-is.
// ---------------------------------------------------------------------------

export interface SystemSizeRequestPayload {
  address: string;
  billUsageKwh: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  billTotalCostDollars: number | null;
  homeDuringDay: "most" | "sometimes" | "rarely" | null;
  heatingNotUsedThisMonth: boolean;
  heatingHours: HoursBucket | null;
  coolingNotUsedThisMonth: boolean;
  coolingHours: HoursBucket | null;
  poolNotUsedThisMonth: boolean;
  poolHours: HoursBucket | null;
  evNotUsedThisMonth: boolean;
  evHours: HoursBucket | null;
  hotWaterNotUsedThisMonth: boolean;
  hotWaterHours: HoursBucket | null;
}

export interface SystemSizeResult {
  systemSizeKw: number;
  /** "backend" when a real recommendation came back from the configured
   * sizing service; "fallback" when we derived it locally instead (backend
   * not configured, unreachable, or errored). */
  source: "backend" | "fallback";
}

export type SystemSizeErrorCode = "NOT_CONFIGURED" | "API_ERROR";

export interface SystemSizeApiError {
  ok: false;
  code: SystemSizeErrorCode;
  message: string;
  /** Always present — a locally-derived size so the flow never dead-ends
   * on a backend that isn't up yet. */
  fallback: SystemSizeResult;
}

export interface SystemSizeApiSuccess {
  ok: true;
  result: SystemSizeResult;
}

export type SystemSizeApiResponse = SystemSizeApiSuccess | SystemSizeApiError;
