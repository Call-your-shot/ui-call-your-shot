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
  /** Whether estimatedAnnualKwh came from the real sizing backend or a
   * local fallback — carried through to /create-proposal's
   * consumption.systemSizeSource. */
  estimatedAnnualKwhSource: "backend" | "fallback" | null;
  estimatedAnnualBillDollars: number | null;
  ratePerKwhCents: number | null;
  /** Whether ratePerKwhCents came from the bill's own total, or a regional
   * default — carried through to /create-proposal's consumption.rateSource. */
  rateSource: "bill" | "wollongong-default" | null;

  /** The system Google Solar (or the mock/manual fallback) actually fitted
   * on the roof, captured on /roof — carried through to /create-proposal's
   * `system` block. Null until /roof has resolved a result. */
  solarSystem: {
    panelCount: number;
    panelWatts: number;
    systemSizeKw: number;
    estimatedAnnualAcKwh: number;
    source: "google" | "mock";
    orientation: string;
    pitchDegrees: number;
  } | null;
}

export const emptyBillFlow: BillFlowState = {
  address: "",
  billingPeriodStart: "",
  billingPeriodEnd: "",
  usageKwh: null,
  billTotalCostDollars: null,

  homeDuringDay: null,

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
  estimatedAnnualKwhSource: null,
  estimatedAnnualBillDollars: null,
  ratePerKwhCents: null,
  rateSource: null,

  solarSystem: null,
};

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
