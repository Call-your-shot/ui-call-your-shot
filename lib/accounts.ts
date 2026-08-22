// ---------------------------------------------------------------------------
// Account model for SunShare.
//
// Role is a capability, not a mode: an Account simply has zero or more
// Tenancies (properties it rents) and zero or more OwnedProperties
// (properties it leases out). Whether someone is "a tenant" or "a landlord"
// is derived from which of those arrays is non-empty — never stored as a
// flag anywhere. See isTenant() / isLandlord() below.
// ---------------------------------------------------------------------------

import { formatAddress, type Address } from "@/lib/mockData";

export type TenancyStatus =
  | "no_solar"
  | "proposal_sent"
  | "awaiting_landlord"
  | "active"
  | "leaving"
  | "ended";

export interface MonthlyUsageRecord {
  month: string;
  solarUsedKwh: number;
  gridUsedKwh: number;
  chargeDollars: number;
  withoutSolarDollars: number;
  savingsDollars: number;
}

export interface MonthlyIncomeRecord {
  month: string;
  generationKwh: number;
  tenantChargeCollected: number;
  exportCredits: number;
  reserveContribution: number;
  netIncome: number;
}

export interface LeaveTimeline {
  noticeGiven: string;
  landlordAcknowledged?: string;
  approved?: string;
  finalStatementIssued?: string;
  planClosed?: string;
}

export interface LeaveRequest {
  requestedDate: string;
  moveOutDate: string;
  reason: string;
  note?: string;
  status: "pending" | "acknowledged" | "approved" | "withdrawn";
  timeline: LeaveTimeline;
}

export interface Tenancy {
  id: string;
  propertyId: string;
  address: Address;
  imageVariant: number;
  status: TenancyStatus;
  startDate?: string;
  ratePerKwhCents: number;
  gridRateCents: number;
  maxTermYears: number;
  monthlyReserveContribution: number;
  balanceRepaid: number;
  balanceTotal: number;
  estimatedCompletionDate?: string;
  landlordName: string;
  propertyManager?: string;
  landlordAgreedDate?: string;
  systemSizeKw: number;
  monthly: MonthlyUsageRecord[];
  leaveRequest?: LeaveRequest;
}

export interface TenantRecord {
  name: string;
  tenancyStart: string;
  tenancyEnd?: string;
  ratePerKwhCents: number;
  contributionToBalance: number;
  current: boolean;
}

export interface SolarSystemInfo {
  sizeKw: number;
  panelCount: number;
  installDate: string;
  inverterModel: string;
  warrantyExpiry: string;
  status: "normal" | "reduced";
  todayGenerationKwh: number;
  currentOutputKw: number;
  performancePercent: number;
  lastReadingAt: string;
  dailyOutputKwh30d: number[];
  serviceHistory: { date: string; description: string }[];
}

export interface MaintenanceReserveInfo {
  accrued: number;
  nextCostDescription: string;
  nextCostDate: string;
  nextCostEstimate: number;
}

export interface PerformanceAlert {
  message: string;
  sinceDays: number;
  belowExpectedPercent: number;
}

export interface PropertyLeaveRequest {
  tenantName: string;
  requestedDate: string;
  moveOutDate: string;
  reason: string;
  status: "pending" | "acknowledged" | "approved";
}

export interface OwnedProperty {
  id: string;
  address: Address;
  imageVariant: number;
  occupancyStatus: "occupied" | "vacant" | "pending_invitation";
  system?: SolarSystemInfo;
  currentTenant?: TenantRecord;
  tenantHistory: TenantRecord[];
  monthlyIncome: number;
  balanceOutstanding: number;
  balanceTotal: number;
  totalEarned: number;
  totalInvested: number;
  monthly: MonthlyIncomeRecord[];
  maintenanceReserve: MaintenanceReserveInfo;
  pendingInvitationEmail?: string;
  performanceAlert?: PerformanceAlert;
  leaveRequest?: PropertyLeaveRequest;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  tenancies: Tenancy[];
  ownedProperties: OwnedProperty[];
}

export function isTenant(account: Account): boolean {
  return account.tenancies.length > 0;
}

export function isLandlord(account: Account): boolean {
  return account.ownedProperties.length > 0;
}

export function getTenancy(account: Account, tenancyId: string): Tenancy | undefined {
  return account.tenancies.find((t) => t.id === tenancyId);
}

export function getOwnedProperty(account: Account, propertyId: string): OwnedProperty | undefined {
  return account.ownedProperties.find((p) => p.id === propertyId);
}

export function totalSavingsToDate(tenancy: Tenancy): number {
  return tenancy.monthly.reduce((sum, m) => sum + m.savingsDollars, 0);
}

export function totalSavingsAcrossAccount(account: Account): number {
  return account.tenancies.reduce((sum, t) => sum + totalSavingsToDate(t), 0);
}

// ---------------------------------------------------------------------------
// Shared helpers for generating 12-14 months of plausible history
// ---------------------------------------------------------------------------

const MONTH_LABELS = [
  "Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025",
  "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026",
];

function seasonalFactor(index: number): number {
  // Peaks in southern-hemisphere summer (Dec/Jan), troughs in winter (Jun/Jul).
  const monthOfYear = (6 + index) % 12; // MONTH_LABELS[0] = July = month index 6
  return 0.75 + 0.5 * Math.cos(((monthOfYear - 0) * Math.PI) / 6);
}

function buildMonthlyUsage(
  months: number,
  baseSolarKwh: number,
  baseGridKwh: number,
  solarRateCents: number,
  gridRateCents: number
): MonthlyUsageRecord[] {
  const start = MONTH_LABELS.length - months;
  return Array.from({ length: months }, (_, i) => {
    const factor = seasonalFactor(start + i);
    const solarUsedKwh = Math.round(baseSolarKwh * factor);
    const gridUsedKwh = Math.round(baseGridKwh * (1.6 - factor));
    const chargeDollars = Math.round(solarUsedKwh * (solarRateCents / 100) * 100) / 100;
    const gridChargeDollars = Math.round(gridUsedKwh * (gridRateCents / 100) * 100) / 100;
    const withoutSolarDollars =
      Math.round((solarUsedKwh + gridUsedKwh) * (gridRateCents / 100) * 100) / 100;
    return {
      month: MONTH_LABELS[start + i],
      solarUsedKwh,
      gridUsedKwh,
      chargeDollars: chargeDollars + gridChargeDollars,
      withoutSolarDollars,
      savingsDollars: Math.round((withoutSolarDollars - (chargeDollars + gridChargeDollars)) * 100) / 100,
    };
  });
}

function buildMonthlyIncome(
  months: number,
  baseGenerationKwh: number,
  tenantRateCents: number,
  exportRateCents: number,
  reserveContribution: number,
  tenantSharePercent = 0.65
): MonthlyIncomeRecord[] {
  const start = MONTH_LABELS.length - months;
  return Array.from({ length: months }, (_, i) => {
    const factor = seasonalFactor(start + i);
    const generationKwh = Math.round(baseGenerationKwh * factor);
    const tenantKwh = Math.round(generationKwh * tenantSharePercent);
    const exportKwh = generationKwh - tenantKwh;
    const tenantChargeCollected = Math.round(tenantKwh * (tenantRateCents / 100) * 100) / 100;
    const exportCredits = Math.round(exportKwh * (exportRateCents / 100) * 100) / 100;
    const netIncome =
      Math.round((tenantChargeCollected + exportCredits - reserveContribution) * 100) / 100;
    return {
      month: MONTH_LABELS[start + i],
      generationKwh,
      tenantChargeCollected,
      exportCredits,
      reserveContribution,
      netIncome,
    };
  });
}

// ---------------------------------------------------------------------------
// Mock accounts
// ---------------------------------------------------------------------------

const bellambiAddress: Address = {
  street: "42 Bellambi Lane",
  suburb: "Bellambi",
  state: "NSW",
  postcode: "2518",
};

const figtreeAddress: Address = {
  street: "17 Fig Tree Drive",
  suburb: "Figtree",
  state: "NSW",
  postcode: "2525",
};

const woononaAddress: Address = {
  street: "5 Northcliffe Drive",
  suburb: "Woonona",
  state: "NSW",
  postcode: "2517",
};

const wollongongApartment: Address = {
  street: "12/88 Corrimal Street",
  suburb: "Wollongong",
  state: "NSW",
  postcode: "2500",
};

/**
 * Overwrites the most recent month's figures to hit a specific headline
 * savings amount exactly, keeping the rest of the seasonal history intact.
 * Used for demo accounts whose "current" saving is called out by name.
 */
function pinLatestMonthSavings(
  monthly: MonthlyUsageRecord[],
  targetSavingsDollars: number,
  solarRateCents: number,
  gridRateCents: number
): MonthlyUsageRecord[] {
  const last = monthly[monthly.length - 1];
  const solarUsedKwh = Math.round(targetSavingsDollars / ((gridRateCents - solarRateCents) / 100));
  const chargeDollars = Math.round(solarUsedKwh * (solarRateCents / 100) * 100) / 100 +
    Math.round(last.gridUsedKwh * (gridRateCents / 100) * 100) / 100;
  const withoutSolarDollars =
    Math.round((solarUsedKwh + last.gridUsedKwh) * (gridRateCents / 100) * 100) / 100;
  return [
    ...monthly.slice(0, -1),
    {
      ...last,
      solarUsedKwh,
      chargeDollars,
      withoutSolarDollars,
      savingsDollars: Math.round((withoutSolarDollars - chargeDollars) * 100) / 100,
    },
  ];
}

function sarahsTenancy(): Tenancy {
  const monthly = pinLatestMonthSavings(buildMonthlyUsage(14, 8.5, 5.5, 15, 30), 98, 15, 30);
  return {
    id: "ten-sarah-bellambi",
    propertyId: "prop-owned-1",
    address: bellambiAddress,
    imageVariant: 0,
    status: "active",
    startDate: "2025-07-01",
    ratePerKwhCents: 15,
    gridRateCents: 30,
    maxTermYears: 9,
    monthlyReserveContribution: 18,
    balanceRepaid: 2810,
    balanceTotal: 6700,
    estimatedCompletionDate: "2033-04-01",
    landlordName: "Marcus Webb",
    landlordAgreedDate: "2025-06-15",
    systemSizeKw: 7.9,
    monthly,
  };
}

const sarahChen: Account = {
  id: "sarah",
  name: "Sarah Chen",
  email: "sarah.chen@example.com",
  avatarInitials: "SC",
  tenancies: [sarahsTenancy()],
  ownedProperties: [],
};

// Property 1's balance is $6,700. The spec calls for the current tenant to
// be "42% of the way through the balance" — split across her own
// contribution plus what the previous tenant already paid down, since the
// balance carries across tenancies rather than resetting.
const PROPERTY_1_BALANCE_TOTAL = 6700;
const PROPERTY_1_TARGET_PROGRESS = 0.42;
const PROPERTY_1_PREVIOUS_TENANT_CONTRIBUTION = 1866;
const PROPERTY_1_CURRENT_TENANT_CONTRIBUTION =
  Math.round(PROPERTY_1_BALANCE_TOTAL * PROPERTY_1_TARGET_PROGRESS) -
  PROPERTY_1_PREVIOUS_TENANT_CONTRIBUTION;

function davidActiveTenancyOnProperty1(): TenantRecord {
  return {
    name: "Amelia Rossi",
    tenancyStart: "2024-11-01",
    ratePerKwhCents: 15,
    contributionToBalance: PROPERTY_1_CURRENT_TENANT_CONTRIBUTION,
    current: true,
  };
}

function davidPreviousTenantOnProperty1(): TenantRecord {
  return {
    name: "Ben Carter",
    tenancyStart: "2023-02-01",
    tenancyEnd: "2024-10-15",
    ratePerKwhCents: 14,
    contributionToBalance: PROPERTY_1_PREVIOUS_TENANT_CONTRIBUTION,
    current: false,
  };
}

const davidMarino: Account = {
  id: "david",
  name: "David Marino",
  email: "david.marino@example.com",
  avatarInitials: "DM",
  tenancies: [],
  ownedProperties: [
    {
      id: "prop-owned-1",
      address: bellambiAddress,
      imageVariant: 0,
      occupancyStatus: "occupied",
      system: {
        sizeKw: 7.9,
        panelCount: 18,
        installDate: "2023-02-01",
        inverterModel: "Fronius Primo 7.0-1",
        warrantyExpiry: "2033-02-01",
        status: "normal",
        todayGenerationKwh: 24.6,
        currentOutputKw: 3.2,
        performancePercent: 96,
        lastReadingAt: "2026-08-21T14:30:00+10:00",
        dailyOutputKwh30d: Array.from({ length: 30 }, (_, i) =>
          Math.round((22 + 6 * Math.sin(i / 3)) * 10) / 10
        ),
        serviceHistory: [
          { date: "2025-08-01", description: "Annual inspection & panel clean" },
          { date: "2024-08-01", description: "Annual inspection & panel clean" },
          { date: "2023-02-01", description: "System installed & commissioned" },
        ],
      },
      currentTenant: davidActiveTenancyOnProperty1(),
      tenantHistory: [davidActiveTenancyOnProperty1(), davidPreviousTenantOnProperty1()],
      monthlyIncome: 428,
      balanceOutstanding:
        PROPERTY_1_BALANCE_TOTAL -
        (PROPERTY_1_CURRENT_TENANT_CONTRIBUTION + PROPERTY_1_PREVIOUS_TENANT_CONTRIBUTION),
      balanceTotal: PROPERTY_1_BALANCE_TOTAL,
      totalEarned: PROPERTY_1_CURRENT_TENANT_CONTRIBUTION + PROPERTY_1_PREVIOUS_TENANT_CONTRIBUTION,
      totalInvested: PROPERTY_1_BALANCE_TOTAL,
      monthly: buildMonthlyIncome(14, 950, 15, 5, 18),
      maintenanceReserve: {
        accrued: 486,
        nextCostDescription: "Inverter replacement",
        nextCostDate: "2035-02-01",
        nextCostEstimate: 1500,
      },
    },
    {
      id: "prop-owned-2",
      address: woononaAddress,
      imageVariant: 3,
      occupancyStatus: "pending_invitation",
      system: {
        sizeKw: 6.6,
        panelCount: 15,
        installDate: "2026-05-12",
        inverterModel: "SolarEdge SE6000H",
        warrantyExpiry: "2036-05-12",
        status: "reduced",
        todayGenerationKwh: 9.1,
        currentOutputKw: 0.6,
        performancePercent: 62,
        lastReadingAt: "2026-08-21T14:30:00+10:00",
        dailyOutputKwh30d: Array.from({ length: 30 }, (_, i) =>
          Math.round((21 - (i > 22 ? (i - 22) * 3.5 : 0) + 3 * Math.sin(i / 4)) * 10) / 10
        ),
        serviceHistory: [{ date: "2026-05-12", description: "System installed & commissioned" }],
      },
      tenantHistory: [],
      monthlyIncome: 0,
      balanceOutstanding: 5200,
      balanceTotal: 5200,
      totalEarned: 0,
      totalInvested: 5200,
      monthly: buildMonthlyIncome(3, 780, 15, 5, 15),
      maintenanceReserve: {
        accrued: 45,
        nextCostDescription: "First annual inspection",
        nextCostDate: "2027-05-01",
        nextCostEstimate: 140,
      },
      pendingInvitationEmail: "new.tenant@example.com",
      performanceAlert: {
        message:
          "Output 34% below expected for 3 consecutive days. The tenant charge has been automatically suspended. Book a service check.",
        sinceDays: 3,
        belowExpectedPercent: 34,
      },
    },
  ],
};

function priyasTenancy(): Tenancy {
  return {
    id: "ten-priya-wollongong",
    propertyId: "prop-owned-3",
    address: wollongongApartment,
    imageVariant: 1,
    status: "active",
    startDate: "2025-03-01",
    ratePerKwhCents: 15,
    gridRateCents: 29,
    maxTermYears: 9,
    monthlyReserveContribution: 14,
    balanceRepaid: 1120,
    balanceTotal: 4100,
    estimatedCompletionDate: "2032-01-01",
    landlordName: "Coastal Realty Group",
    propertyManager: "Coastal Realty Group",
    landlordAgreedDate: "2025-02-14",
    systemSizeKw: 5.3,
    monthly: buildMonthlyUsage(14, 5.2, 6.8, 15, 29),
  };
}

const priyaNair: Account = {
  id: "priya",
  name: "Priya Nair",
  email: "priya.nair@example.com",
  avatarInitials: "PN",
  tenancies: [priyasTenancy()],
  ownedProperties: [
    {
      id: "prop-priya-figtree",
      address: figtreeAddress,
      imageVariant: 4,
      occupancyStatus: "occupied",
      system: {
        sizeKw: 9.2,
        panelCount: 21,
        installDate: "2024-09-01",
        inverterModel: "Fronius Symo 9.0-3",
        warrantyExpiry: "2034-09-01",
        status: "normal",
        todayGenerationKwh: 31.4,
        currentOutputKw: 4.1,
        performancePercent: 101,
        lastReadingAt: "2026-08-21T14:30:00+10:00",
        dailyOutputKwh30d: Array.from({ length: 30 }, (_, i) =>
          Math.round((28 + 7 * Math.sin(i / 3.4)) * 10) / 10
        ),
        serviceHistory: [
          { date: "2025-09-01", description: "Annual inspection & panel clean" },
          { date: "2024-09-01", description: "System installed & commissioned" },
        ],
      },
      currentTenant: {
        name: "Josh Fielding",
        tenancyStart: "2024-09-15",
        ratePerKwhCents: 15,
        contributionToBalance: 2960,
        current: true,
      },
      tenantHistory: [
        {
          name: "Josh Fielding",
          tenancyStart: "2024-09-15",
          ratePerKwhCents: 15,
          contributionToBalance: 2960,
          current: true,
        },
      ],
      monthlyIncome: 396,
      balanceOutstanding: 7800 - 2960,
      balanceTotal: 7800,
      totalEarned: 2960,
      totalInvested: 7800,
      monthly: buildMonthlyIncome(12, 1080, 15, 5, 20),
      maintenanceReserve: {
        accrued: 312,
        nextCostDescription: "Inverter replacement",
        nextCostDate: "2036-09-01",
        nextCostEstimate: 1600,
      },
    },
  ],
};

export const mockAccounts: Record<string, Account> = {
  sarah: sarahChen,
  david: davidMarino,
  priya: priyaNair,
};

export const defaultAccountId = "priya";

export function formatPropertyAddress(address: Address): string {
  return formatAddress(address);
}
