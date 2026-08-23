// ---------------------------------------------------------------------------
// SunShare mock data. Everything the UI reads lives here — no backend calls.
// ---------------------------------------------------------------------------

export type UserRole = "tenant" | "landlord";

export type ScenarioId = "bellambi" | "shaded";

export type PlanStatus = "active" | "pending" | "declined";

export interface Address {
  street: string;
  suburb: string;
  state: string;
  postcode: string;
}

export function formatAddress(a: Address): string {
  return `${a.street}, ${a.suburb} ${a.state} ${a.postcode}`;
}

export interface BillDetails {
  retailer: string;
  planName: string;
  tariffType: string;
  peakRateCents: number;
  shoulderRateCents: number;
  offPeakRateCents: number;
  dailySupplyChargeDollars: number;
  averageDailyUsageKwh: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  address: Address;
}

export const mockBillDetails: BillDetails = {
  retailer: "Origin Energy",
  planName: "Everyday Rewards Variable",
  tariffType: "Time of use",
  peakRateCents: 42.9,
  shoulderRateCents: 28.6,
  offPeakRateCents: 22.1,
  dailySupplyChargeDollars: 1.14,
  averageDailyUsageKwh: 14.2,
  billingPeriodStart: "2026-05-01",
  billingPeriodEnd: "2026-07-31",
  address: {
    street: "42 Bellambi Lane",
    suburb: "Bellambi",
    state: "NSW",
    postcode: "2518",
  },
};

export interface HouseholdProfile {
  occupants: "1" | "2" | "3-4" | "5+";
  homeDuringDay: "most" | "sometimes" | "rarely";
  appliances: string[];
  stayDuration: "under1" | "1-3" | "3+" | "unsure";
}

export const mockHousehold: HouseholdProfile = {
  occupants: "2",
  homeDuringDay: "sometimes",
  appliances: ["aircon", "hotwater", "dishwasher"],
  stayDuration: "1-3",
};

export const appliancesOptions: { id: string; label: string }[] = [
  { id: "aircon", label: "Air conditioning" },
  { id: "hotwater", label: "Electric hot water" },
  { id: "dishwasher", label: "Dishwasher" },
  { id: "pool", label: "Pool pump" },
  { id: "ev", label: "Electric vehicle" },
];

export interface RoofDesign {
  panelCount: number;
  systemSizeKw: number;
  orientation: string;
  pitchDegrees: number;
  usableFace: string;
}

export interface FinancialResults {
  annualSavings: number;
  currentAnnualBill: number;
  withSunShareAnnualBill: number;
  solarSharePercent: number;
  gridSharePercent: number;
  solarRateCents: number;
  gridRateCents: number;
  landlordExportRateCents: number;
  landlordSunShareRateCents: number;
  payoffYear: number;
  systemCost: number;
  federalRebate: number;
  netLandlordInvestment: number;
  maintenanceReserve20yr: number;
  landlordReturnPercent: number;
  confidencePercent: number;
}

export interface RefusalReason {
  metric: string;
  value: string;
  threshold: string;
}

export interface PropertyScenario {
  id: ScenarioId;
  works: boolean;
  address: Address;
  imageDescription: string;
  roof: RoofDesign;
  results?: FinancialResults;
  refusalReasons?: RefusalReason[];
}

export const scenarios: Record<ScenarioId, PropertyScenario> = {
  bellambi: {
    id: "bellambi",
    works: true,
    address: mockBillDetails.address,
    imageDescription: "North-facing tile roof, Bellambi NSW",
    roof: {
      panelCount: 18,
      systemSizeKw: 7.9,
      orientation: "North-facing",
      pitchDegrees: 22,
      usableFace: "Main north face",
    },
    results: {
      // Derived from mockBillDetails.averageDailyUsageKwh (14.2 kWh/day ->
      // 5,183 kWh/yr) split by solarSharePercent below, at solarRateCents /
      // gridRateCents: currentAnnualBill = 5183 * 0.30; withSunShareAnnualBill
      // = (5183*0.62)*0.15 + (5183*0.38)*0.30; annualSavings = the difference.
      // Keep these three in lockstep if any of those four inputs change.
      annualSavings: 482,
      currentAnnualBill: 1555,
      withSunShareAnnualBill: 1073,
      solarSharePercent: 62,
      gridSharePercent: 38,
      solarRateCents: 15,
      gridRateCents: 30,
      landlordExportRateCents: 5,
      landlordSunShareRateCents: 15,
      payoffYear: 2033,
      systemCost: 9800,
      federalRebate: 3100,
      netLandlordInvestment: 6700,
      maintenanceReserve20yr: 2400,
      landlordReturnPercent: 7.1,
      confidencePercent: 94,
    },
  },
  shaded: {
    id: "shaded",
    works: false,
    address: {
      street: "8 Escarpment Rise",
      suburb: "Bulli",
      state: "NSW",
      postcode: "2516",
    },
    imageDescription: "South-facing roof, shaded by escarpment",
    roof: {
      panelCount: 6,
      systemSizeKw: 2.4,
      orientation: "South-facing",
      pitchDegrees: 18,
      usableFace: "Rear south face",
    },
    refusalReasons: [
      {
        metric: "Roof orientation",
        value: "South-facing",
        threshold: "Needs north, east or west",
      },
      {
        metric: "Afternoon shading",
        value: "68% shaded 12pm–4pm",
        threshold: "Must be under 20%",
      },
      {
        metric: "Projected landlord return",
        value: "1.2% p.a.",
        threshold: "Needs 5%+ p.a. to be worthwhile",
      },
      {
        metric: "Projected tenant savings",
        value: "$140 / yr",
        threshold: "Needs $400+/yr to be worth the agreement",
      },
    ],
  },
};

// Confidence fan chart — annual savings across modelled futures, year by year.
export interface ConfidencePoint {
  year: number;
  low: number;
  median: number;
  high: number;
}

// Same relative shape as before, rescaled so year 1's median matches the
// corrected annualSavings figure above (factor = 482/1180).
export const confidenceFan: ConfidencePoint[] = [
  { year: 1, low: 319, median: 482, high: 621 },
  { year: 2, low: 335, median: 507, high: 658 },
  { year: 3, low: 351, median: 531, high: 694 },
  { year: 4, low: 364, median: 551, high: 727 },
  { year: 5, low: 372, median: 572, high: 760 },
];

// ---------------------------------------------------------------------------
// Monthly readings — 12 months of usage & billing history for the active plan
// ---------------------------------------------------------------------------

export interface MonthlyReading {
  month: string;
  solarUsedKwh: number;
  gridUsedKwh: number;
  exportedKwh: number;
  chargeDollars: number;
  savingsDollars: number;
}

export const mockMonthlyReadings: MonthlyReading[] = [
  { month: "Sep 2025", solarUsedKwh: 260, gridUsedKwh: 190, exportedKwh: 140, chargeDollars: 39.0, savingsDollars: 38.0 },
  { month: "Oct 2025", solarUsedKwh: 300, gridUsedKwh: 165, exportedKwh: 180, chargeDollars: 45.0, savingsDollars: 45.0 },
  { month: "Nov 2025", solarUsedKwh: 330, gridUsedKwh: 150, exportedKwh: 210, chargeDollars: 49.5, savingsDollars: 49.5 },
  { month: "Dec 2025", solarUsedKwh: 350, gridUsedKwh: 140, exportedKwh: 230, chargeDollars: 52.5, savingsDollars: 52.5 },
  { month: "Jan 2026", solarUsedKwh: 345, gridUsedKwh: 145, exportedKwh: 225, chargeDollars: 51.8, savingsDollars: 51.8 },
  { month: "Feb 2026", solarUsedKwh: 320, gridUsedKwh: 155, exportedKwh: 200, chargeDollars: 48.0, savingsDollars: 48.0 },
  { month: "Mar 2026", solarUsedKwh: 290, gridUsedKwh: 165, exportedKwh: 175, chargeDollars: 43.5, savingsDollars: 43.5 },
  { month: "Apr 2026", solarUsedKwh: 250, gridUsedKwh: 180, exportedKwh: 140, chargeDollars: 37.5, savingsDollars: 37.5 },
  { month: "May 2026", solarUsedKwh: 210, gridUsedKwh: 200, exportedKwh: 100, chargeDollars: 31.5, savingsDollars: 31.5 },
  { month: "Jun 2026", solarUsedKwh: 190, gridUsedKwh: 210, exportedKwh: 80, chargeDollars: 28.5, savingsDollars: 28.5 },
  { month: "Jul 2026", solarUsedKwh: 200, gridUsedKwh: 205, exportedKwh: 85, chargeDollars: 30.0, savingsDollars: 30.0 },
  { month: "Aug 2026", solarUsedKwh: 284, gridUsedKwh: 176, exportedKwh: 150, chargeDollars: 42.6, savingsDollars: 42.6 },
];

// ---------------------------------------------------------------------------
// 20-year maintenance schedule
// ---------------------------------------------------------------------------

export interface MaintenanceEvent {
  year: number;
  description: string;
  costDollars: number;
}

export const maintenanceSchedule: MaintenanceEvent[] = [
  { year: 1, description: "Annual inspection & panel clean", costDollars: 120 },
  { year: 3, description: "Annual inspection & panel clean", costDollars: 120 },
  { year: 5, description: "Inverter firmware & performance check", costDollars: 150 },
  { year: 7, description: "Annual inspection & panel clean", costDollars: 140 },
  { year: 10, description: "Mounting & wiring inspection", costDollars: 220 },
  { year: 12, description: "Inverter replacement", costDollars: 1400 },
  { year: 15, description: "Annual inspection & panel clean", costDollars: 160 },
  { year: 18, description: "Mounting & wiring inspection", costDollars: 240 },
  { year: 20, description: "End-of-term system health audit", costDollars: 180 },
];

// ---------------------------------------------------------------------------
// Plan terms & fairness guarantees
// ---------------------------------------------------------------------------

export interface PlanTerms {
  solarRateCents: number;
  maxTermYears: number;
  monthlyReserveContribution: number;
}

export const defaultPlanTerms: PlanTerms = {
  solarRateCents: 15,
  maxTermYears: 9,
  monthlyReserveContribution: 18,
};

export const fairnessGuarantees: string[] = [
  "Tenant never pays more than grid price in any half hour",
  "Tenant can exit at any time, no penalty",
  "Balance stays with the property, not the tenant",
  "Charge halves permanently once the balance is repaid — never rises again",
  "Charge suspends automatically if the system stops generating",
];

// ---------------------------------------------------------------------------
// Plans — the lifecycle objects shown in /plans, /plan/[id], /proposal/[id]
// ---------------------------------------------------------------------------

export interface Plan {
  id: string;
  status: PlanStatus;
  scenario: ScenarioId;
  address: Address;
  tenantName: string;
  landlordName: string;
  createdDate: string;
  startDate?: string;
  estimatedCompletionDate?: string;
  balanceRepaid: number;
  balanceTotal: number;
  maintenanceReserveAccrued: number;
  terms: PlanTerms;
}

export const mockPlans: Plan[] = [
  {
    id: "plan-active",
    status: "active",
    scenario: "bellambi",
    address: mockBillDetails.address,
    tenantName: "You",
    landlordName: "Marcus Webb",
    createdDate: "2025-08-15",
    startDate: "2025-09-01",
    estimatedCompletionDate: "2033-03-01",
    balanceRepaid: 2840,
    balanceTotal: 6700,
    maintenanceReserveAccrued: 432,
    terms: defaultPlanTerms,
  },
  {
    id: "plan-pending",
    status: "pending",
    scenario: "bellambi",
    address: mockBillDetails.address,
    tenantName: "You",
    landlordName: "Marcus Webb",
    createdDate: "2026-08-10",
    balanceRepaid: 0,
    balanceTotal: 6700,
    maintenanceReserveAccrued: 0,
    terms: defaultPlanTerms,
  },
  {
    id: "plan-declined",
    status: "declined",
    scenario: "shaded",
    address: scenarios.shaded.address,
    tenantName: "You",
    landlordName: "Qimatx",
    createdDate: "2026-06-02",
    balanceRepaid: 0,
    balanceTotal: 0,
    maintenanceReserveAccrued: 0,
    terms: defaultPlanTerms,
  },
];

export function getPlan(id: string): Plan | undefined {
  return mockPlans.find((p) => p.id === id);
}

export function getScenarioForPlan(plan: Plan): PropertyScenario {
  return scenarios[plan.scenario];
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatCurrency(value: number, opts?: { cents?: boolean }): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: opts?.cents ? 2 : 0,
    maximumFractionDigits: opts?.cents ? 2 : 0,
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const rebateStepDownDate = "2027-01-01";
export const rebateStepDownSavings = 640;

// ---------------------------------------------------------------------------
// Landlord payback schedule — net position (negative = still owed) by year
// ---------------------------------------------------------------------------

export interface PaybackPoint {
  year: number;
  balance: number;
}

export interface CurrentMonthDetail {
  solarUsedKwh: number;
  solarChargeDollars: number;
  gridUsedKwh: number;
  gridChargeDollars: number;
  totalDollars: number;
  withoutSolarDollars: number;
  savingsDollars: number;
  freeWindowKwh: number;
  freeWindowLabel: string;
}

export const currentMonthDetail: CurrentMonthDetail = {
  solarUsedKwh: 284,
  solarChargeDollars: 42.6,
  gridUsedKwh: 176,
  gridChargeDollars: 53.2,
  totalDollars: 95.8,
  withoutSolarDollars: 138.4,
  savingsDollars: 42.6,
  freeWindowKwh: 12,
  freeWindowLabel: "11am–2pm Solar Sharer window",
};

export const paybackSchedule: PaybackPoint[] = [
  { year: 0, balance: -6700 },
  { year: 1, balance: -5680 },
  { year: 2, balance: -4660 },
  { year: 3, balance: -3640 },
  { year: 4, balance: -2620 },
  { year: 5, balance: -1600 },
  { year: 6, balance: -580 },
  { year: 7, balance: 440 },
  { year: 8, balance: 1460 },
];
