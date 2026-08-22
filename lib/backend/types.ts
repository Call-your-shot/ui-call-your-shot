import type { Account } from "@/lib/accounts";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_initials: string;
  phone?: string | null;
  created_at: string;
  status: string;
}

export interface BackendDashboard {
  tenancies: Account["tenancies"];
  ownedProperties: Account["ownedProperties"];
}

export interface DistributionSummary {
  mean: number;
  median: number;
  std_dev: number;
  p05: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  minimum: number;
  maximum: number;
}

export interface InitialAssessment {
  id: string;
  createdAt: string;
  forecastSource: "assumption_based";
  recommendation: "viable" | "manual_review" | "not_recommended";
  reviewReasons: string[];
  installationCostSource: "provided" | "model_default";
  address: {
    formattedAddress: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  system: {
    source: "google" | "manual" | "mock";
    imageryQuality?: "HIGH" | "MEDIUM" | "BASE" | null;
    imageryDate?: string | null;
    panelCount: number;
    panelWatts: number;
    systemSizeKw: number;
    expectedAnnualGenerationKwh: number;
    roofAreaM2?: number | null;
    usableRoofAreaM2?: number | null;
  };
  tenantEconomics: {
    baselineAnnualBillDollars: number;
    projectedAnnualElectricityCostDollars: DistributionSummary;
    annualSavingsDollars: DistributionSummary;
    solarShareRatio: DistributionSummary;
    probabilitySavesMoney: number;
  };
  landlordEconomics: {
    netInstallationCostDollars: number;
    firstYearNetCashflowDollars: DistributionSummary;
    simpleAnnualYieldPercentage: DistributionSummary | null;
    medianPaybackYears: number | null;
    paybackRangeYears: { lower: number | null; upper: number | null };
    probabilityPaybackWithin7Years: number;
    probabilityPaybackWithin10Years: number;
  };
  pricing: {
    mode: "dynamic" | "fixed";
    tenantSolarRateCentsPerKwh: DistributionSummary;
    gridRateCentsPerKwh: number;
    exportRateCentsPerKwh: number;
    method: string;
  };
  monteCarlo: {
    payback_cdf: Array<{ years: number; probability: number }>;
    payback_histogram: { bins_years: number[]; counts: number[] };
    probability_no_payback_within_horizon: number;
    simulation: { iterations: number; forecast_years: number; random_seed: number | null };
    assumptions: { expected_annual_usage_kwh: number };
  };
  warnings: Array<{ code: string; message: string }>;
}

export interface InitialAssessmentInput {
  address: {
    formattedAddress: string;
    latitude?: number;
    longitude?: number;
  };
  system: {
    source: "google" | "manual" | "mock";
    imageryQuality?: "HIGH" | "MEDIUM" | "BASE";
    imageryDate?: string;
    panelCount: number;
    panelWatts: number;
    systemSizeKw: number;
    expectedAnnualGenerationKwh: number;
    roofAreaM2?: number;
    usableRoofAreaM2?: number;
  };
  household: {
    expectedAnnualUsageKwh: number;
    currentAnnualBillDollars?: number;
    gridRateCentsPerKwh?: number;
    daytimeOccupancy: "most" | "sometimes" | "rarely";
  };
  installation?: {
    grossInstallationCostDollars?: number;
    stcBenefitDollars?: number;
    otherRebatesDollars?: number;
    annualOperatingCostDollars?: number;
  };
  pricing?: {
    pricingMode?: "dynamic" | "fixed";
    exportRateCentsPerKwh?: number;
    fixedTenantSolarRateCentsPerKwh?: number;
  };
  simulation?: {
    iterations?: number;
    forecastYears?: number;
    randomSeed?: number;
  };
}

export interface BackendProposal {
  id: string;
  propertyId: string;
  proposalType: string;
  assessmentId?: string | null;
  title: string;
  description: string;
  status: string;
  inviteToken: string;
  inviteUrl: string;
  tenant: { name: string; email: string };
  landlord?: { name: string; email: string } | null;
  system: {
    panelCount: number;
    systemSizeKw: number;
    panelWatts: number;
    estimatedAnnualAcKwh: number;
  };
  consumption: { estimatedAnnualKwh: number; ratePerKwhCents: number };
  financialSummary: Record<string, unknown>;
  property: Record<string, unknown>;
  createdAt: string;
}
