import type { DistributionSummary } from "@/lib/backend/types";
import type { CandidateSizingResult, SolarSizingInput, SolarSizingResult } from "@/lib/sizing/types";

function summary(value: number): DistributionSummary {
  const rounded = Math.round(value * 100) / 100;
  return {
    mean: rounded,
    median: rounded,
    std_dev: 0,
    p05: rounded,
    p25: rounded,
    p50: rounded,
    p75: rounded,
    p95: rounded,
    minimum: rounded,
    maximum: rounded,
  };
}

function usageTotal(input: SolarSizingInput): number {
  return input.monthlyDemand.reduce((sum, month) => sum + Math.max(0, Number(month.usageKwh) || 0), 0);
}

function scoreCandidate(candidate: { annualGenerationKwh: number }, annualUsageKwh: number): number {
  const generation = Math.max(0, Number(candidate.annualGenerationKwh) || 0);
  const coverage = annualUsageKwh > 0 ? generation / annualUsageKwh : 0;
  const oversizePenalty = coverage > 1.15 ? (coverage - 1.15) * 2 : 0;
  return Math.abs(1 - coverage) + oversizePenalty;
}

function buildAlternative(
  candidate: SolarSizingInput["candidates"][number],
  input: SolarSizingInput,
  annualUsageKwh: number,
): CandidateSizingResult {
  const generation = Math.max(0, Number(candidate.annualGenerationKwh) || 0);
  const daytimeRatio = input.daytimeOccupancy === "most" ? 0.55 : input.daytimeOccupancy === "rarely" ? 0.25 : 0.4;
  const tenantSolarKwh = Math.min(annualUsageKwh * daytimeRatio, generation * 0.72);
  const exportKwh = Math.max(0, generation - tenantSolarKwh);
  const selfConsumptionRatio = generation > 0 ? tenantSolarKwh / generation : 0;
  const solarCoverageRatio = annualUsageKwh > 0 ? tenantSolarKwh / annualUsageKwh : 0;
  const gridRate = input.pricing.gridRateCentsPerKwh / 100;
  const tenantRate =
    input.pricing.pricingMode === "fixed" && input.pricing.fixedTenantSolarRateCentsPerKwh
      ? input.pricing.fixedTenantSolarRateCentsPerKwh / 100
      : gridRate * 0.6;
  const exportRate = input.pricing.exportRateCentsPerKwh / 100;
  const tenantSavings = tenantSolarKwh * Math.max(0, gridRate - tenantRate);
  const revenue = tenantSolarKwh * tenantRate + exportKwh * exportRate;
  const installCost = Math.round(candidate.systemSizeKw * 1450);
  const operatingCost = Math.round(candidate.systemSizeKw * 25);
  const netCashflow = revenue - operatingCost;
  const medianPaybackYears = netCashflow > 0 ? Math.round((installCost / netCashflow) * 100) / 100 : null;
  const qualified = tenantSavings > 0 && netCashflow > 0 && selfConsumptionRatio >= 0.25;

  return {
    candidateId: candidate.candidateId,
    panelCount: candidate.panelCount,
    systemSizeKw: candidate.systemSizeKw,
    annualGenerationKwh: generation,
    netInstallationCostDollars: installCost,
    medianTenantSolarConsumptionKwh: Math.round(tenantSolarKwh),
    medianExportKwh: Math.round(exportKwh),
    selfConsumptionRatio: Math.round(selfConsumptionRatio * 1000) / 1000,
    exportRatio: generation > 0 ? Math.round((exportKwh / generation) * 1000) / 1000 : 0,
    solarCoverageRatio: Math.round(solarCoverageRatio * 1000) / 1000,
    firstYearTenantSavingsDollars: summary(tenantSavings),
    firstYearNetCashflowDollars: summary(netCashflow),
    medianPaybackYears,
    paybackRangeYears: {
      lower: medianPaybackYears == null ? null : Math.round(medianPaybackYears * 0.9 * 100) / 100,
      upper: medianPaybackYears == null ? null : Math.round(medianPaybackYears * 1.15 * 100) / 100,
    },
    probabilityTenantSaves: tenantSavings > 0 ? 1 : 0,
    probabilityPaybackWithinHorizon:
      medianPaybackYears != null && medianPaybackYears <= (input.simulation?.forecastYears ?? 20) ? 1 : 0,
    marginalPaybackYears: medianPaybackYears,
    qualified,
    rejectionReasons: qualified ? [] : ["Candidate is not economically strong enough under the current assumptions."],
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SolarSizingInput;
    if (!Array.isArray(body.candidates) || body.candidates.length === 0) {
      return Response.json({ message: "At least one solar candidate is required" }, { status: 400 });
    }

    const annualUsageKwh = usageTotal(body);
    const alternatives = body.candidates
      .map((candidate) => buildAlternative(candidate, body, annualUsageKwh))
      .sort((a, b) => scoreCandidate(a, annualUsageKwh) - scoreCandidate(b, annualUsageKwh));
    const qualified = alternatives.filter((candidate) => candidate.qualified);
    const recommended = qualified[0] ?? alternatives[0];

    const result: SolarSizingResult = {
      status: qualified.length > 0 ? "viable" : "manual_review",
      recommendedCandidateId: recommended.candidateId,
      recommendedPanelCount: recommended.panelCount,
      recommendedSystemSizeKw: recommended.systemSizeKw,
      roofMaximumPanelCount: Math.max(...body.candidates.map((candidate) => candidate.panelCount)),
      annualUsageKwh: Math.round(annualUsageKwh),
      monthlyUsageWeights: body.monthlyDemand.map((month) =>
        annualUsageKwh > 0 ? Math.round((Math.max(0, Number(month.usageKwh) || 0) / annualUsageKwh) * 10_000) / 10_000 : 0,
      ),
      recommendationReason:
        "Selected from submitted roof candidates using annual demand, daytime use, export value, and simple payback.",
      selectionMethod: "monthly_demand_economic_candidate_simulation",
      alternatives,
      warnings: [],
    };

    return Response.json(result);
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Could not calculate solar sizing" },
      { status: 400 },
    );
  }
}
