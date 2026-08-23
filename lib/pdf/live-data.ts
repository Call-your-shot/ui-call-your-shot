import type { BackendProposal, DistributionSummary, InitialAssessment } from "@/lib/backend/types";

export interface ProposalPdfData {
  reference: string;
  preparedDate: string;
  validUntilDate: string;
  status: string;
  propertyAddress: string;
  tenantName: string;
  tenantEmail: string;
  landlordName: string;
  landlordEmail: string;
  inviteToken: string;
  assessmentId: string | null;
  recommendation: string;
  reviewReasons: string[];
  warnings: Array<{ code: string; message: string }>;
  system: {
    panelCount: number;
    panelWatts: number;
    systemSizeKw: number;
    expectedAnnualGenerationKwh: number;
    source: string;
    imageryQuality: string | null;
  };
  household: {
    expectedAnnualUsageKwh: number;
    baselineAnnualBillDollars: number | null;
  };
  tenantEconomics: {
    annualSavings: DistributionSummary | null;
    projectedAnnualCost: DistributionSummary | null;
    solarShare: DistributionSummary | null;
    probabilitySavesMoney: number | null;
  };
  landlordEconomics: {
    netInstallationCostDollars: number | null;
    firstYearCashflow: DistributionSummary | null;
    medianPaybackYears: number | null;
    paybackRangeYears: { lower: number | null; upper: number | null };
    probabilityPaybackWithin7Years: number | null;
    probabilityPaybackWithin10Years: number | null;
  };
  pricing: {
    mode: string;
    method: string;
    tenantSolarRate: DistributionSummary | null;
    gridRateCentsPerKwh: number;
    exportRateCentsPerKwh: number | null;
  };
  simulation: {
    iterations: number | null;
    forecastYears: number | null;
    randomSeed: number | null;
    probabilityNoPayback: number | null;
  };
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function propertyAddress(proposal: BackendProposal): string {
  const property = proposal.property;
  const named = property.name;
  if (typeof named === "string" && named.trim()) return named;

  const line = property.address_line_1 ?? property.addressLine1;
  const locality = [property.suburb, property.state, property.postcode]
    .filter(Boolean)
    .join(" ");
  return [line, locality].filter(Boolean).join(", ") || proposal.title;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function fixedDistribution(value: number): DistributionSummary {
  return {
    mean: value,
    median: value,
    std_dev: 0,
    p05: value,
    p25: value,
    p50: value,
    p75: value,
    p95: value,
    minimum: value,
    maximum: value,
  };
}

export function buildProposalPdfData(
  proposal: BackendProposal,
  assessment: InitialAssessment | null,
  preparedAt = new Date()
): ProposalPdfData {
  const financial = proposal.financialSummary;
  const created = new Date(proposal.createdAt);
  const referenceYear = Number.isNaN(created.getTime())
    ? preparedAt.getUTCFullYear()
    : created.getUTCFullYear();
  const fallbackSavings = numberValue(
    financial.estimatedAnnualTenantSavings ?? financial.estimatedAnnualSavings
  );
  const fallbackCashflow = numberValue(financial.estimatedAnnualLandlordCashflow);
  const fallbackPayback = numberValue(financial.medianPaybackYears);
  const fallbackInvestment = numberValue(financial.netInstallationCostDollars);
  const range = financial.paybackRangeYears;
  const rangeObject = range && typeof range === "object" ? (range as Record<string, unknown>) : {};

  return {
    reference: `SSA-${referenceYear}-${proposal.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
    preparedDate: preparedAt.toISOString(),
    validUntilDate: addDays(preparedAt, 30).toISOString(),
    status: proposal.status,
    propertyAddress: propertyAddress(proposal),
    tenantName: proposal.tenant.name,
    tenantEmail: proposal.tenant.email,
    landlordName: proposal.landlord?.name || "Property owner",
    landlordEmail: proposal.landlord?.email || "Invite recipient",
    inviteToken: proposal.inviteToken,
    assessmentId: proposal.assessmentId ?? null,
    recommendation: assessment?.recommendation ?? "legacy_proposal",
    reviewReasons: assessment?.reviewReasons ?? [],
    warnings: assessment?.warnings ?? [
      {
        code: "ASSESSMENT_UNAVAILABLE",
        message: "The full saved ROI assessment was unavailable when this document was generated.",
      },
    ],
    system: {
      panelCount: proposal.system.panelCount,
      panelWatts: proposal.system.panelWatts,
      systemSizeKw: proposal.system.systemSizeKw,
      expectedAnnualGenerationKwh: proposal.system.estimatedAnnualAcKwh,
      source: assessment?.system.source ?? "proposal snapshot",
      imageryQuality: assessment?.system.imageryQuality ?? null,
    },
    household: {
      expectedAnnualUsageKwh: proposal.consumption.estimatedAnnualKwh,
      baselineAnnualBillDollars: assessment?.tenantEconomics.baselineAnnualBillDollars ?? null,
    },
    tenantEconomics: {
      annualSavings:
        assessment?.tenantEconomics.annualSavingsDollars ??
        (fallbackSavings == null ? null : fixedDistribution(fallbackSavings)),
      projectedAnnualCost: assessment?.tenantEconomics.projectedAnnualElectricityCostDollars ?? null,
      solarShare: assessment?.tenantEconomics.solarShareRatio ?? null,
      probabilitySavesMoney:
        assessment?.tenantEconomics.probabilitySavesMoney ??
        numberValue(financial.probabilityTenantSavesMoney),
    },
    landlordEconomics: {
      netInstallationCostDollars:
        assessment?.landlordEconomics.netInstallationCostDollars ?? fallbackInvestment,
      firstYearCashflow:
        assessment?.landlordEconomics.firstYearNetCashflowDollars ??
        (fallbackCashflow == null ? null : fixedDistribution(fallbackCashflow)),
      medianPaybackYears: assessment?.landlordEconomics.medianPaybackYears ?? fallbackPayback,
      paybackRangeYears:
        assessment?.landlordEconomics.paybackRangeYears ?? {
          lower: numberValue(rangeObject.lower),
          upper: numberValue(rangeObject.upper),
        },
      probabilityPaybackWithin7Years:
        assessment?.landlordEconomics.probabilityPaybackWithin7Years ?? null,
      probabilityPaybackWithin10Years:
        assessment?.landlordEconomics.probabilityPaybackWithin10Years ?? null,
    },
    pricing: {
      mode: assessment?.pricing.mode ?? "not recorded",
      method: assessment?.pricing.method ?? "proposal snapshot",
      tenantSolarRate: assessment?.pricing.tenantSolarRateCentsPerKwh ?? null,
      gridRateCentsPerKwh:
        assessment?.pricing.gridRateCentsPerKwh ?? proposal.consumption.ratePerKwhCents,
      exportRateCentsPerKwh: assessment?.pricing.exportRateCentsPerKwh ?? null,
    },
    simulation: {
      iterations: assessment?.monteCarlo.simulation.iterations ?? null,
      forecastYears: assessment?.monteCarlo.simulation.forecast_years ?? null,
      randomSeed: assessment?.monteCarlo.simulation.random_seed ?? null,
      probabilityNoPayback:
        assessment?.monteCarlo.probability_no_payback_within_horizon ?? null,
    },
  };
}
