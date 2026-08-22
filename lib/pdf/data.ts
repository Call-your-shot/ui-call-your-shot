import {
  Plan,
  PropertyScenario,
  formatAddress,
  formatCurrency,
  formatDate,
  getPlan,
  getScenarioForPlan,
  maintenanceSchedule,
  paybackSchedule,
  mockMonthlyReadings,
  mockHousehold,
  mockBillDetails,
  currentMonthDetail,
  mockPlans,
} from "@/lib/mockData";
import { policy } from "@/lib/pdf/policy";

export interface OwnerYearRow {
  year: number;
  opening: number;
  income: number;
  reserveContribution: number;
  net: number;
  closing: number;
}

export interface OccupantMonthRow {
  month: string;
  gridOnlyCost: number;
  agreementCost: number;
  saving: number;
}

export interface ReserveYearRow {
  year: number;
  event: string | null;
  eventCost: number;
  contribution: number;
  balance: number;
}

export interface AssumptionRow {
  label: string;
  value: string;
  source: string;
}

export interface ProposalPdfData {
  plan: Plan;
  scenario: PropertyScenario;
  reference: string;
  preparedDate: Date;
  validUntilDate: Date;
  ownerName: string;
  occupantName: string;
  propertyAddress: string;

  // A1
  annualGenerationKwh: number;
  annualIncomeToOwner: number;
  recoveryPeriodLabel: string;

  // A4 / Schedule 2
  ownerYearRows: OwnerYearRow[];

  // A5
  occupantMonthRows: OccupantMonthRow[];
  occupantAnnualGridOnly: number;
  occupantAnnualAgreement: number;
  occupantAnnualSaving: number;
  occupantFullTermSaving: number;

  // A6 / Schedule 3
  reserveYearRows: ReserveYearRow[];

  // A7 / Schedule 2
  assumptions: AssumptionRow[];

  // System spec — Schedule 1
  systemSpec: {
    panelModel: string;
    panelWattage: number;
    panelCount: number;
    systemSizeKw: number;
    inverterModel: string;
    installDate: Date;
    installer: string;
    panelWarrantyYears: number;
    inverterWarrantyYears: number;
    inverterExpectedLifeYears: number;
    inverterReplacementCost: number;
    workmanshipWarrantyYears: number;
    monitoring: string;
    meterSpec: string;
  };

  // Clause 14 — the reduced rate Occupant pays after Completion, instead of
  // the Tariff Rate ceasing altogether (see lib/pdf/PartB.tsx clause 14).
  postCompletionRateCents: number;

  // A2 — imagery
  imagery: {
    source: string;
    date: Date;
    quality: "HIGH" | "MEDIUM" | "LOW";
  };

  // Schedule 4
  workedExample: {
    label: string;
    solarUsedKwh: number;
    solarChargeDollars: number;
    gridUsedKwh: number;
    gridChargeDollars: number;
    totalDollars: number;
    withoutSolarDollars: number;
    savingsDollars: number;
    freeWindowKwh: number;
    freeWindowLabel: string;
    reserveContribution: number;
    recoveryBalanceBefore: number;
    recoveryBalanceMovement: number;
    recoveryBalanceAfter: number;
  };

  termYears: number;
  tariffRateCents: number;
  gridRateCents: number;
  exportRateCents: number;
  recoveryBalance: number;
  monthlyReserveContribution: number;
  startDateLabel: string;
  endDateLabel: string;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function recoveryPeriodFromSchedule(): string {
  for (let i = 1; i < paybackSchedule.length; i++) {
    const prev = paybackSchedule[i - 1];
    const cur = paybackSchedule[i];
    if (prev.balance < 0 && cur.balance >= 0) {
      const frac = -prev.balance / (cur.balance - prev.balance);
      const totalYears = prev.year + frac;
      const years = Math.floor(totalYears);
      const months = Math.round((totalYears - years) * 12);
      return months > 0 ? `${years} years ${months} months` : `${years} years`;
    }
  }
  const last = paybackSchedule[paybackSchedule.length - 1];
  return `${last.year}+ years`;
}

export function loadProposalPdfData(id: string): ProposalPdfData | undefined {
  const plan = getPlan(id);
  if (!plan) return undefined;
  const scenario = getScenarioForPlan(plan);
  const r = scenario.results;
  if (!r) return undefined;

  const planIndex = mockPlans.findIndex((p) => p.id === plan.id);
  const referenceYear = new Date(plan.createdDate).getFullYear();
  const reference = `SSA-${referenceYear}-${String(planIndex + 1).padStart(4, "0")}`;

  const preparedDate = new Date();
  const validUntilDate = addDays(preparedDate, policy.validityWindowDays);

  const annualGenerationKwh = Math.round(scenario.roof.systemSizeKw * policy.annualYieldPerKw);

  // Clause 14 — after Completion the Tariff Rate reduces rather than
  // dropping to zero, so the Owner isn't left funding maintenance/insurance
  // indefinitely on zero ongoing income.
  const postCompletionRateCents = Math.round(r.solarRateCents * policy.postCompletionRateFraction * 10) / 10;

  const totalChargeDollars = sum(mockMonthlyReadings.map((m) => m.chargeDollars));
  const totalSavingsDollars = sum(mockMonthlyReadings.map((m) => m.savingsDollars));

  const annualReserveContribution = plan.terms.monthlyReserveContribution * 12;

  const ownerYearRows: OwnerYearRow[] = [];
  for (let i = 1; i < paybackSchedule.length; i++) {
    const opening = paybackSchedule[i - 1].balance;
    const closing = paybackSchedule[i].balance;
    const net = closing - opening;
    const income = net + annualReserveContribution;
    ownerYearRows.push({
      year: paybackSchedule[i].year,
      opening,
      income,
      reserveContribution: annualReserveContribution,
      net,
      closing,
    });
  }
  // Year 1 of the Recovery Balance schedule is the canonical "first year" income figure.
  const annualIncomeToOwner = ownerYearRows[0]?.income ?? 0;

  // The monthly meter readings give a realistic seasonal shape, but their raw
  // total doesn't tie to the plan's headline annualSavings figure (a separate,
  // curated number used across the rest of the product). Scale the monthly
  // rows so the shape is preserved but the annual total matches that figure.
  const savingsScale = totalSavingsDollars > 0 ? r.annualSavings / totalSavingsDollars : 1;
  const occupantMonthRows: OccupantMonthRow[] = mockMonthlyReadings.map((m) => ({
    month: m.month,
    gridOnlyCost: (m.chargeDollars + m.savingsDollars) * savingsScale,
    agreementCost: m.chargeDollars * savingsScale,
    saving: m.savingsDollars * savingsScale,
  }));

  const reserveYearRows: ReserveYearRow[] = [];
  let reserveBalance = 0;
  const lastMaintenanceYear = maintenanceSchedule[maintenanceSchedule.length - 1].year;
  for (let year = 1; year <= lastMaintenanceYear; year++) {
    const event = maintenanceSchedule.find((e) => e.year === year);
    reserveBalance += plan.terms.monthlyReserveContribution * 12;
    if (event) reserveBalance -= event.costDollars;
    reserveYearRows.push({
      year,
      event: event?.description ?? null,
      eventCost: event?.costDollars ?? 0,
      contribution: plan.terms.monthlyReserveContribution * 12,
      balance: reserveBalance,
    });
  }

  const assumptions: AssumptionRow[] = [
    {
      label: "Grid electricity rate",
      value: `${r.gridRateCents}c / kWh`,
      source: `Occupant's electricity bill (${mockBillDetails.retailer}, ${mockBillDetails.planName})`,
    },
    {
      label: "Solar (Tariff) rate charged to Occupant",
      value: `${r.solarRateCents}c / kWh`,
      source: "SunShare standard — approx. half the Grid Rate, per the Never-Worse-Off Guarantee",
    },
    {
      label: "Feed-in / export tariff to Owner",
      value: `${r.landlordExportRateCents}c / kWh`,
      source: "Retailer feed-in tariff, indicative NSW rate",
    },
    {
      label: "Annual generation estimate",
      value: `${annualGenerationKwh.toLocaleString("en-AU")} kWh (${policy.annualYieldPerKw} kWh/kW/yr)`,
      source: "Clean Energy Council indicative PV yield, Illawarra NSW",
    },
    {
      label: "Panel degradation rate",
      value: `${policy.degradationPercentPerYear}% per year, linear`,
      source: "Manufacturer datasheet — industry-standard linear degradation",
    },
    {
      label: "Occupant household consumption",
      value: `${mockBillDetails.averageDailyUsageKwh} kWh/day average, ${mockHousehold.occupants} occupants`,
      source: "Occupant's electricity bill and household profile",
    },
    {
      label: "Tenancy turnover",
      value: "Modelled at one change of occupant per tenancy cycle",
      source: "Clause 11 applies unchanged terms to the Property, not the individual",
    },
    {
      label: "Federal rebate",
      value: formatCurrency(r.federalRebate),
      source: "Federal small-scale technology certificate (STC) scheme, indicative",
    },
    {
      label: "Maintenance reserve contribution",
      value: `${formatCurrency(plan.terms.monthlyReserveContribution)} / billing period`,
      source: "SunShare standard reserve rate, Schedule 3",
    },
    {
      label: "Post-Completion Tariff Rate",
      value: `${postCompletionRateCents} cents / kWh`,
      source: `Clause 14.2 — ${policy.postCompletionRateFraction * 100}% of the Tariff Rate at Completion, CPI-indexed`,
    },
  ];

  const inverterEvent = maintenanceSchedule.find((e) => e.description.toLowerCase().includes("inverter replacement"));
  const systemSpec = {
    panelModel: "REC Alpha Pure-R",
    panelWattage: Math.round((scenario.roof.systemSizeKw * 1000) / scenario.roof.panelCount / 10) * 10,
    panelCount: scenario.roof.panelCount,
    systemSizeKw: scenario.roof.systemSizeKw,
    inverterModel: "Fronius Primo single-phase inverter",
    installDate: new Date(plan.startDate ?? plan.createdDate),
    installer: "SunShare Certified Partner Network",
    panelWarrantyYears: policy.panelWarrantyYears,
    inverterWarrantyYears: 10,
    inverterExpectedLifeYears: inverterEvent?.year ?? 12,
    inverterReplacementCost: inverterEvent?.costDollars ?? 0,
    workmanshipWarrantyYears: 6,
    monitoring: "Owner and Occupant web portal (the Platform) — real-time generation, consumption and Recovery Balance",
    meterSpec: "NMI Pattern-Approved revenue meter, Class 1.0 accuracy or better (National Measurement Act 1960)",
  };

  const imagery = {
    source: "Google Solar API aerial imagery",
    date: new Date(plan.createdDate),
    quality: "HIGH" as const,
  };

  const monthlyReserve = plan.terms.monthlyReserveContribution;
  const recoveryBalanceBefore = plan.balanceTotal - plan.balanceRepaid;
  const recoveryBalanceMovement = currentMonthDetail.solarChargeDollars - monthlyReserve;
  const workedExample = {
    label: mockMonthlyReadings[mockMonthlyReadings.length - 1].month,
    solarUsedKwh: currentMonthDetail.solarUsedKwh,
    solarChargeDollars: currentMonthDetail.solarChargeDollars,
    gridUsedKwh: currentMonthDetail.gridUsedKwh,
    gridChargeDollars: currentMonthDetail.gridChargeDollars,
    totalDollars: currentMonthDetail.totalDollars,
    withoutSolarDollars: currentMonthDetail.withoutSolarDollars,
    savingsDollars: currentMonthDetail.savingsDollars,
    freeWindowKwh: currentMonthDetail.freeWindowKwh,
    freeWindowLabel: currentMonthDetail.freeWindowLabel,
    reserveContribution: monthlyReserve,
    recoveryBalanceBefore,
    recoveryBalanceMovement,
    recoveryBalanceAfter: recoveryBalanceBefore - recoveryBalanceMovement,
  };

  const startDate = new Date(plan.startDate ?? plan.createdDate);
  const endDate = addYears(startDate, plan.terms.maxTermYears);

  return {
    plan,
    scenario,
    reference,
    preparedDate,
    validUntilDate,
    ownerName: plan.landlordName,
    // "You" is the in-app placeholder for whoever's signed in as tenant —
    // fine for dashboard-style UI, not a valid party name on an executable
    // legal document.
    occupantName: plan.tenantName === "You" ? "[Tenant Full Legal Name]" : plan.tenantName,
    propertyAddress: formatAddress(plan.address),
    annualGenerationKwh,
    postCompletionRateCents,
    annualIncomeToOwner,
    recoveryPeriodLabel: recoveryPeriodFromSchedule(),
    ownerYearRows,
    occupantMonthRows,
    occupantAnnualGridOnly: totalChargeDollars * savingsScale + r.annualSavings,
    occupantAnnualAgreement: totalChargeDollars * savingsScale,
    occupantAnnualSaving: r.annualSavings,
    occupantFullTermSaving: r.annualSavings * plan.terms.maxTermYears,
    reserveYearRows,
    assumptions,
    systemSpec,
    imagery,
    workedExample,
    termYears: plan.terms.maxTermYears,
    tariffRateCents: r.solarRateCents,
    gridRateCents: r.gridRateCents,
    exportRateCents: r.landlordExportRateCents,
    recoveryBalance: r.netLandlordInvestment,
    monthlyReserveContribution: plan.terms.monthlyReserveContribution,
    startDateLabel: formatDate(startDate.toISOString()),
    endDateLabel: formatDate(endDate.toISOString()),
  };
}
