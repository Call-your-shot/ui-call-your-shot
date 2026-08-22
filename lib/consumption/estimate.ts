import type { ConsumptionEstimate, ConsumptionInputs, HoursBucket, Season, SeasonalUsage } from "./types";

// Southern-hemisphere (Australian) seasons, non-leap-year day counts.
const SEASON_DAYS: Record<Season, number> = {
  summer: 90, // Dec, Jan, Feb
  autumn: 92, // Mar, Apr, May
  winter: 92, // Jun, Jul, Aug
  spring: 91, // Sep, Oct, Nov
};

// Typical appliance draw while running.
const HEATER_KW = 2.0;
const AC_KW = 1.5;
const POOL_PUMP_KW = 1.0;
const EV_CHARGER_KW = 7.0;
const HOT_WATER_KW = 3.6;

const HOURS_MIDPOINT: Record<HoursBucket, number> = {
  "0-2": 1,
  "2-4": 3,
  "4-8": 6,
  "8+": 9,
};

// Rough blended residential rate for the Wollongong/Illawarra (Ausgrid/Endeavour)
// area, used only when the bill itself doesn't show a total dollar amount.
const WOLLONGONG_DEFAULT_RATE_CENTS = 33;

function monthToSeason(monthIndex0: number): Season {
  // 11=Dec, 0=Jan, 1=Feb -> summer; 2-4 autumn; 5-7 winter; 8-10 spring.
  if (monthIndex0 === 11 || monthIndex0 <= 1) return "summer";
  if (monthIndex0 <= 4) return "autumn";
  if (monthIndex0 <= 7) return "winter";
  return "spring";
}

function daysBySeason(startIso: string, endIso: string): SeasonalUsage {
  const counts: SeasonalUsage = { summer: 0, autumn: 0, winter: 0, spring: 0 };
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    // Bad/missing dates — treat as a single day in the current season so the
    // caller still gets a usable (if unweighted) estimate rather than NaN.
    counts[monthToSeason(new Date().getMonth())] = 1;
    return counts;
  }
  const cursor = new Date(start);
  while (cursor <= end) {
    counts[monthToSeason(cursor.getMonth())] += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return counts;
}

function dominantSeason(dayCounts: SeasonalUsage): Season {
  return (Object.keys(dayCounts) as Season[]).reduce((best, season) =>
    dayCounts[season] > dayCounts[best] ? season : best
  );
}

/** Which season a bill's billing period mostly falls in — used to decide
 * which "not used this month" questions are even worth asking (a winter
 * bill already reflects heating, so there's no point asking about it). */
export function getBillSeason(billingPeriodStart: string, billingPeriodEnd: string): Season {
  return dominantSeason(daysBySeason(billingPeriodStart, billingPeriodEnd));
}

function dailyKwhIfFlagged(flagged: boolean, hours: HoursBucket | null, applianceKw: number): number {
  if (!flagged || !hours) return 0;
  return HOURS_MIDPOINT[hours] * applianceKw;
}

/**
 * Converts an observed bill (one season's worth of actual usage) plus
 * answers about appliances NOT reflected in that bill into an estimated
 * annual kWh figure, broken down by season, plus an estimated annual $ bill.
 * The LLM only ever reads the bill's raw fields — everything below is
 * deterministic so the numbers are always explainable.
 */
export function estimateAnnualUsage(inputs: ConsumptionInputs): ConsumptionEstimate {
  const billDayCounts = daysBySeason(inputs.billingPeriodStart, inputs.billingPeriodEnd);
  const totalBillDays = Math.max(1, Object.values(billDayCounts).reduce((a, b) => a + b, 0));
  const observedDailyKwh = inputs.billUsageKwh / totalBillDays;

  const heatingDailyKwh = dailyKwhIfFlagged(
    inputs.heatingNotUsedThisMonth,
    inputs.heatingHours,
    HEATER_KW
  );
  const coolingDailyKwh = dailyKwhIfFlagged(inputs.coolingNotUsedThisMonth, inputs.coolingHours, AC_KW);
  const flatDailyKwh =
    dailyKwhIfFlagged(inputs.poolNotUsedThisMonth, inputs.poolHours, POOL_PUMP_KW) +
    dailyKwhIfFlagged(inputs.evNotUsedThisMonth, inputs.evHours, EV_CHARGER_KW) +
    dailyKwhIfFlagged(inputs.hotWaterNotUsedThisMonth, inputs.hotWaterHours, HOT_WATER_KW);

  // The observed daily rate is carried forward to every day of the year as
  // the baseline; we only add extra load for the days the bill DIDN'T
  // cover, for appliances the household told us aren't reflected in it.
  const seasons = Object.keys(SEASON_DAYS) as Season[];
  const seasonalKwh = seasons.reduce((acc, season) => {
    const daysOutsideBill = Math.max(0, SEASON_DAYS[season] - billDayCounts[season]);
    let extraDailyKwh = flatDailyKwh;
    if (season === "winter") extraDailyKwh += heatingDailyKwh;
    if (season === "summer") extraDailyKwh += coolingDailyKwh;
    acc[season] = Math.round(SEASON_DAYS[season] * observedDailyKwh + extraDailyKwh * daysOutsideBill);
    return acc;
  }, {} as SeasonalUsage);

  const annualKwh = Object.values(seasonalKwh).reduce((a, b) => a + b, 0);

  const hasRealRate = !!inputs.billTotalCostDollars && inputs.billTotalCostDollars > 0 && inputs.billUsageKwh > 0;
  const ratePerKwhCents = hasRealRate
    ? (inputs.billTotalCostDollars! / inputs.billUsageKwh) * 100
    : WOLLONGONG_DEFAULT_RATE_CENTS;

  return {
    annualKwh,
    seasonalKwh,
    ratePerKwhCents: Math.round(ratePerKwhCents * 10) / 10,
    rateSource: hasRealRate ? "bill" : "wollongong-default",
    estimatedAnnualBillDollars: Math.round(annualKwh * ratePerKwhCents) / 100,
  };
}
