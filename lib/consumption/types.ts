// ---------------------------------------------------------------------------
// Types for turning a bill reading + a short household questionnaire into an
// estimated annual kWh (and $) figure (used to size the solar system on
// /roof). The questionnaire only ever asks about appliances that AREN'T
// reflected in this month's bill — the bill itself is ground truth for
// whatever season it falls in.
// ---------------------------------------------------------------------------

export type HoursBucket = "0-2" | "2-4" | "4-8" | "8+";
export type Season = "summer" | "autumn" | "winter" | "spring";

export interface ConsumptionInputs {
  /** Total kWh used across the billing period, as read off the bill. */
  billUsageKwh: number;
  /** ISO date (YYYY-MM-DD). */
  billingPeriodStart: string;
  /** ISO date (YYYY-MM-DD). */
  billingPeriodEnd: string;
  /** Total dollars charged for that period, if known — lets us use the
   * household's real c/kWh rate instead of a regional default. */
  billTotalCostDollars: number | null;

  /** Each pair below means: "yes, we have/use this, just not reflected in
   * this month's bill" — hours is how long per day it runs when it IS used. */
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

export type SeasonalUsage = Record<Season, number>;

export interface ConsumptionEstimate {
  annualKwh: number;
  seasonalKwh: SeasonalUsage;
  ratePerKwhCents: number;
  /** "bill" when we backed the rate out of a real dollar amount on the
   * bill; "wollongong-default" when we fell back to a regional estimate. */
  rateSource: "bill" | "wollongong-default";
  estimatedAnnualBillDollars: number;
}
