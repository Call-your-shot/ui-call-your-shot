import type { HoursBucket } from "@/lib/consumption/types";

// ---------------------------------------------------------------------------
// The JSON payload we hand to the sizing backend, and the shape it hands
// back. The backend estimates the household's annual electricity load in
// kWh; Google's Solar API then picks the closest real panel configuration
// for that target on the actual roof.
// ---------------------------------------------------------------------------

export interface AnnualLoadRequestPayload {
  address: string;
  billUsageKwh: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  billTotalCostDollars: number | null;
  homeDuringDay: "most" | "sometimes" | "rarely" | null;
  occupantCount: number;
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

export interface MonthlyDemandEstimate {
  calendarMonth: number;
  monthName: string;
  usageKwh: number;
  daytimeUsageRatio: number;
  source: "observed_bill" | "bill_period_derived" | "survey_derived";
}

export interface AnnualLoadResult {
  estimatedAnnualUsageKwh: number;
  monthlyUsage: MonthlyDemandEstimate[];
  observedMonthCount: number;
  profileSource: "observed_bills" | "observed_and_survey_derived" | "single_bill_and_survey";
  dataQuality: "high" | "medium" | "low";
  /** "backend" when a real estimate came back from the configured sizing
   * service; "fallback" when we derived it locally instead (backend not
   * configured, unreachable, or errored). */
  source: "backend" | "fallback";
}

export type AnnualLoadErrorCode = "NOT_CONFIGURED" | "API_ERROR";

export interface AnnualLoadApiError {
  ok: false;
  code: AnnualLoadErrorCode;
  message: string;
  /** Always present — a locally-derived estimate so the flow never
   * dead-ends on a backend that isn't up yet. */
  fallback: AnnualLoadResult;
}

export interface AnnualLoadApiSuccess {
  ok: true;
  result: AnnualLoadResult;
}

export type AnnualLoadApiResponse = AnnualLoadApiSuccess | AnnualLoadApiError;
