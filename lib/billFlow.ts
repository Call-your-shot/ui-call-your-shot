import type { HoursBucket } from "@/lib/consumption/types";

// ---------------------------------------------------------------------------
// Shared state for the scan -> household -> roof wizard. Each step is a
// separate route (full unmount/remount on navigation), so state has to live
// outside React — sessionStorage, read on mount and written on every change.
// ---------------------------------------------------------------------------

export interface BillFlowState {
  address: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  usageKwh: number | null;
  /** Total $ charged for the bill period, if known — powers a real c/kWh
   * rate instead of a regional default. */
  billTotalCostDollars: number | null;

  homeDuringDay: "most" | "sometimes" | "rarely" | null;
  occupantCount: number;

  // Each pair below: "yes, we have/use this, just not this month" + how many
  // hours/day it runs when it IS used.
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

  /** From the annual-load backend when configured, otherwise derived
   * locally. Drives panel selection on /roof via Google Solar's own
   * annual-kWh-target matching. */
  estimatedAnnualKwh: number | null;
  estimatedAnnualBillDollars: number | null;
  ratePerKwhCents: number | null;
  monthlyUsage: import("@/lib/annualLoad/types").MonthlyDemandEstimate[];
  usageProfileSource: "observed_bills" | "observed_and_survey_derived" | "single_bill_and_survey" | null;
  usageDataQuality: "high" | "medium" | "low" | null;
}

export const emptyBillFlow: BillFlowState = {
  address: "",
  billingPeriodStart: "",
  billingPeriodEnd: "",
  usageKwh: null,
  billTotalCostDollars: null,

  homeDuringDay: null,
  occupantCount: 1,

  heatingNotUsedThisMonth: false,
  heatingHours: null,
  coolingNotUsedThisMonth: false,
  coolingHours: null,
  poolNotUsedThisMonth: false,
  poolHours: null,
  evNotUsedThisMonth: false,
  evHours: null,
  hotWaterNotUsedThisMonth: false,
  hotWaterHours: null,

  estimatedAnnualKwh: null,
  estimatedAnnualBillDollars: null,
  ratePerKwhCents: null,
  monthlyUsage: [],
  usageProfileSource: null,
  usageDataQuality: null,
};

export const NEW_ASSESSMENT_HREF = "/household?new=1";

const STORAGE_KEY = "sunshare-bill-flow";

export function loadBillFlow(): BillFlowState {
  if (typeof window === "undefined") return emptyBillFlow;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyBillFlow;
    return { ...emptyBillFlow, ...JSON.parse(raw) };
  } catch {
    return emptyBillFlow;
  }
}

export function saveBillFlow(state: BillFlowState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore write failures (private mode etc.)
  }
}

/** Clears every browser-side reference to the previous assessment before a
 * user starts entering a different property or household. */
export function resetBillFlow(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem("sunshare-latest-assessment-id");
  } catch {
    // ignore storage failures (private mode etc.)
  }
}

/** Defaults used when the user enters details manually instead of uploading
 * a bill: "last month", ending yesterday. */
export function lastMonthRange(): { start: string; end: string } {
  const end = new Date();
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}
