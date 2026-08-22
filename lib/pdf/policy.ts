// Standard contract parameters applied to every SunShare agreement.
// Unlike the financial figures in lib/pdf/data.ts, these are fixed product
// policy, not per-plan data — centralised here so they're set once, not
// scattered through the clause text.
export const policy = {
  maxTermYears: 9,
  occupantTerminationNoticeDays: 14,
  ownerTerminationNonPaymentDays: 60,
  performanceSuspensionThresholdPercent: 60,
  performanceSuspensionDays: 3,
  panelWarrantyYears: 25,
  // Clause 14 — after Completion, the Tariff Rate reduces to this fraction
  // of its pre-Completion value (still CPI-indexed, still capped by the
  // Never-Worse-Off Guarantee) rather than dropping to zero. Keeps the
  // Owner earning a perpetual yield instead of holding a maintenance
  // liability with no ongoing income.
  postCompletionRateFraction: 0.5,
  annualYieldPerKw: 1316, // kWh/kW/yr — Clean Energy Council indicative yield, Illawarra NSW
  degradationPercentPerYear: 0.5, // industry-standard linear panel degradation
  validityWindowDays: 30,
  ombudsman: "Energy and Water Ombudsman NSW",
};

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

export function numberToWords(n: number): string {
  return ONES[n] ?? String(n);
}
