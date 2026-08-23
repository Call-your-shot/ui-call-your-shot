import { describe, expect, it } from "vitest";
import type { BackendProposal, DistributionSummary, InitialAssessment } from "@/lib/backend/types";
import { buildProposalPdfData } from "@/lib/pdf/live-data";

const distribution = (median: number, p05 = median * 0.8, p95 = median * 1.2): DistributionSummary => ({
  mean: median,
  median,
  std_dev: 1,
  p05,
  p25: (p05 + median) / 2,
  p50: median,
  p75: (median + p95) / 2,
  p95,
  minimum: p05,
  maximum: p95,
});

const proposal: BackendProposal = {
  id: "12345678-abcd-4000-8000-123456789abc",
  propertyId: "property-1",
  proposalType: "solar",
  assessmentId: "assessment-1",
  title: "Rooftop Solar Proposal",
  description: "Saved proposal",
  status: "sent",
  inviteToken: "invite-1",
  inviteUrl: "http://localhost:3000/invite/invite-1",
  tenant: { name: "Priya Shah", email: "priya@example.com" },
  landlord: { name: "Property owner", email: "owner@example.com" },
  system: {
    panelCount: 18,
    panelWatts: 440,
    systemSizeKw: 7.92,
    estimatedAnnualAcKwh: 9108,
  },
  consumption: { estimatedAnnualKwh: 6500, ratePerKwhCents: 30 },
  financialSummary: {
    estimatedAnnualTenantSavings: 573,
    netInstallationCostDollars: 7500,
  },
  property: { name: "42 Bellambi Lane, Bellambi NSW 2518" },
  createdAt: "2026-08-22T10:00:00Z",
};

const assessment: InitialAssessment = {
  id: "assessment-1",
  createdAt: "2026-08-22T10:00:00Z",
  forecastSource: "assumption_based",
  recommendation: "viable",
  reviewReasons: [],
  installationCostSource: "provided",
  address: { formattedAddress: "42 Bellambi Lane, Bellambi NSW 2518" },
  system: {
    source: "google",
    imageryQuality: "HIGH",
    panelCount: 18,
    panelWatts: 440,
    systemSizeKw: 7.92,
    expectedAnnualGenerationKwh: 9108,
  },
  tenantEconomics: {
    baselineAnnualBillDollars: 1950,
    projectedAnnualElectricityCostDollars: distribution(1377),
    annualSavingsDollars: distribution(573, 420, 710),
    solarShareRatio: distribution(0.5, 0.4, 0.6),
    probabilitySavesMoney: 1,
  },
  landlordEconomics: {
    netInstallationCostDollars: 7500,
    firstYearNetCashflowDollars: distribution(1020, 850, 1200),
    simpleAnnualYieldPercentage: distribution(13.6),
    medianPaybackYears: 7.86,
    paybackRangeYears: { lower: 6.7, upper: 9.4 },
    probabilityPaybackWithin7Years: 0.31,
    probabilityPaybackWithin10Years: 0.98,
  },
  pricing: {
    mode: "dynamic",
    tenantSolarRateCentsPerKwh: distribution(17.4),
    gridRateCentsPerKwh: 30,
    exportRateCentsPerKwh: 5,
    method: "usage_function",
  },
  monteCarlo: {
    payback_cdf: [],
    payback_histogram: { bins_years: [], counts: [] },
    probability_no_payback_within_horizon: 0.01,
    simulation: { iterations: 10000, forecast_years: 20, random_seed: 42 },
    assumptions: { expected_annual_usage_kwh: 6500 },
  },
  warnings: [],
};

describe("buildProposalPdfData", () => {
  it("uses saved assessment economics and stable proposal identity", () => {
    const data = buildProposalPdfData(proposal, assessment, new Date("2026-08-23T00:00:00Z"));

    expect(data.reference).toBe("SSA-2026-12345678");
    expect(data.propertyAddress).toBe("42 Bellambi Lane, Bellambi NSW 2518");
    expect(data.landlordEmail).toBe("owner@example.com");
    expect(data.tenantEconomics.annualSavings?.median).toBe(573);
    expect(data.landlordEconomics.medianPaybackYears).toBe(7.86);
    expect(data.pricing.tenantSolarRate?.median).toBe(17.4);
    expect(data.simulation.iterations).toBe(10000);
    expect(data.validUntilDate).toBe("2026-09-22T00:00:00.000Z");
  });

  it("falls back to the immutable proposal snapshot when assessment data is unavailable", () => {
    const data = buildProposalPdfData(proposal, null, new Date("2026-08-23T00:00:00Z"));

    expect(data.tenantEconomics.annualSavings?.median).toBe(573);
    expect(data.landlordEconomics.netInstallationCostDollars).toBe(7500);
    expect(data.warnings[0].code).toBe("ASSESSMENT_UNAVAILABLE");
  });
});
