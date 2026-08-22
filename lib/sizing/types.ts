import type { DistributionSummary } from "@/lib/backend/types";
import type { MonthlyDemandEstimate } from "@/lib/annualLoad/types";
import type { SolarResult } from "@/lib/solar/types";

export interface SolarSizingInput {
  monthlyDemand: MonthlyDemandEstimate[];
  candidates: Array<{
    candidateId: string;
    source: SolarResult["source"];
    panelCount: number;
    panelWatts: number;
    systemSizeKw: number;
    annualGenerationKwh: number;
    monthlyGenerationKwh?: number[];
  }>;
  daytimeOccupancy: "most" | "sometimes" | "rarely";
  pricing: {
    pricingMode: "dynamic" | "fixed";
    gridRateCentsPerKwh: number;
    exportRateCentsPerKwh: number;
    fixedTenantSolarRateCentsPerKwh?: number;
  };
  simulation?: { iterations: number; forecastYears: number; randomSeed: number };
}

export interface CandidateSizingResult {
  candidateId: string;
  panelCount: number;
  systemSizeKw: number;
  annualGenerationKwh: number;
  netInstallationCostDollars: number;
  medianTenantSolarConsumptionKwh: number;
  medianExportKwh: number;
  selfConsumptionRatio: number;
  exportRatio: number;
  solarCoverageRatio: number;
  firstYearTenantSavingsDollars: DistributionSummary;
  firstYearNetCashflowDollars: DistributionSummary;
  medianPaybackYears: number | null;
  paybackRangeYears: { lower: number | null; upper: number | null };
  probabilityTenantSaves: number;
  probabilityPaybackWithinHorizon: number;
  marginalPaybackYears: number | null;
  qualified: boolean;
  rejectionReasons: string[];
}

export interface SolarSizingResult {
  status: "viable" | "manual_review" | "not_recommended";
  recommendedCandidateId: string | null;
  recommendedPanelCount: number | null;
  recommendedSystemSizeKw: number | null;
  roofMaximumPanelCount: number;
  annualUsageKwh: number;
  monthlyUsageWeights: number[];
  recommendationReason: string;
  selectionMethod: "monthly_demand_economic_candidate_simulation";
  alternatives: CandidateSizingResult[];
  warnings: Array<{ code: string; message: string }>;
}
