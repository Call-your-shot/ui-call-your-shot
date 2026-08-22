"use client";

import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import { useDemo } from "@/lib/demo-context";
import {
  formatPropertyAddress,
  isLandlord,
  isTenant,
  totalSavingsToDate,
  type OwnedProperty,
  type Tenancy,
} from "@/lib/accounts";
import { formatDate } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Battery,
  Building2,
  CheckCircle2,
  Home,
  Sun,
  Wallet,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { BillShockKiller } from "@/components/dashboard/BillShockKiller";
import { LiveSwitchboard } from "@/components/dashboard/LiveSwitchboard";
import { EnergyMixDonut } from "@/components/dashboard/EnergyMixDonut";
import { DiurnalProfileChart } from "@/components/dashboard/DiurnalProfileChart";
import { TariffShieldChart } from "@/components/dashboard/TariffShieldChart";
import { GamifiedImpactWidget } from "@/components/dashboard/GamifiedImpactWidget";
import { CapitalBurndownChart } from "@/components/dashboard/CapitalBurndownChart";
import { CashflowWaterfall } from "@/components/dashboard/CashflowWaterfall";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function DashboardPage() {
  const { account } = useDemo();
  const tenant = isTenant(account);
  const landlord = isLandlord(account);

  if (!tenant && !landlord) {
    return <WelcomeEmptyState />;
  }

  return (
    <div>
      <h1 className="text-h1">Welcome back, {account.name.split(" ")[0]}</h1>
      <p className="text-body mt-1">Here&apos;s where things stand today.</p>

      {tenant && <TenantSection tenancies={account.tenancies} />}
      {landlord && <LandlordSection properties={account.ownedProperties} />}
    </div>
  );
}

function WelcomeEmptyState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-lighter text-primary-darker">
          <Home size={26} aria-hidden="true" />
        </span>
        <h2 className="text-h2 mt-4">Welcome to SunShare</h2>
        <p className="text-body mt-2">
          Tell us which side of the roof you&apos;re on and we&apos;ll get you started.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button href="/roof" fullWidth>
            I rent a home
          </Button>
          <Button href="/properties/new" variant="secondary" fullWidth>
            I own a rental property
          </Button>
        </div>
      </Card>
    </div>
  );
}

function TenantSection({ tenancies }: { tenancies: Tenancy[] }) {
  const [selectedId, setSelectedId] = useState(tenancies[0].id);
  const tenancy = tenancies.find((t) => t.id === selectedId) ?? tenancies[0];
  const savingsToDate = totalSavingsToDate(tenancy);
  const lastMonth = tenancy.monthly[tenancy.monthly.length - 1];

  return (
    <section className="mt-10">
      <h2 className="text-h2">As a tenant</h2>

      {tenancies.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {tenancies.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold whitespace-nowrap",
                t.id === tenancy.id ? "bg-primary text-white" : "bg-grey-200 text-grey-600"
              )}
            >
              {formatPropertyAddress(t.address)}
            </button>
          ))}
        </div>
      )}

      {tenancy.status !== "active" ? (
        <div className="mt-4">
          <TenancyStatusCallout tenancy={tenancy} />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Top Hero Stat Card */}
          <Card className="lg:col-span-12">
            <p className="text-[13px] font-semibold tracking-wide text-grey-600 uppercase">
              Total saved since switching to solar
            </p>
            <p className="text-data mt-2 text-success">{formatCurrency(savingsToDate)}</p>
            <p className="text-small mt-1">
              Since {tenancy.startDate ? formatDate(tenancy.startDate) : "—"} at{" "}
              {formatPropertyAddress(tenancy.address)}
            </p>
          </Card>

          {/* Widget 2: Live Switchboard Power Flow (Full Width) */}
          <div className="lg:col-span-12">
            <LiveSwitchboard />
          </div>

          {/* Widget 1: Bill Shock Killer (6 Cols) */}
          <div className="lg:col-span-6">
            <BillShockKiller
              currentMonthGridOnly={lastMonth?.withoutSolarDollars ?? 118}
              currentMonthActual={lastMonth?.chargeDollars ?? 32}
              currentMonthSaved={lastMonth?.savingsDollars ?? 86}
            />
          </div>

          {/* Widget 3: Energy Mix Donut (6 Cols) */}
          <div className="lg:col-span-6">
            <EnergyMixDonut
              solarKwh={lastMonth?.solarUsedKwh ?? 210}
              batteryKwh={110}
              gridKwh={85}
            />
          </div>

          {/* Widget 4: Diurnal Profile Chart (6 Cols) */}
          <div className="lg:col-span-6">
            <DiurnalProfileChart />
          </div>

          {/* Widget 5: Tariff Shield Chart (6 Cols) */}
          <div className="lg:col-span-6">
            <TariffShieldChart />
          </div>

          {/* Widget 6: Gamified Impact Widget (Full Width) */}
          <div className="lg:col-span-12">
            <GamifiedImpactWidget totalSolarKwh={lastMonth ? lastMonth.solarUsedKwh * 6 : 1240} />
          </div>

          <div className="lg:col-span-12 text-center pt-2">
            <Link href={`/plans/${tenancy.id}`} className="text-[14px] font-bold text-primary hover:underline">
              View full plan terms, statements &amp; history →
            </Link>
          </div>
        </div>

      )}
    </section>
  );
}

function TenancyStatusCallout({ tenancy }: { tenancy: Tenancy }) {
  if (tenancy.status === "no_solar") {
    return (
      <Callout variant="info" heading="No solar plan yet">
        This property doesn&apos;t have a SunShare plan yet.{" "}
        <Link href="/roof" className="font-bold underline">
          Start an assessment
        </Link>{" "}
        to see what&apos;s possible.
      </Callout>
    );
  }
  if (tenancy.status === "proposal_sent" || tenancy.status === "awaiting_landlord") {
    return (
      <Callout variant="warning" heading="Waiting on your landlord">
        Your proposal for {formatPropertyAddress(tenancy.address)} is with{" "}
        {tenancy.landlordName}.{" "}
        <Link href={`/plans/${tenancy.id}`} className="font-bold underline">
          View the plan
        </Link>
      </Callout>
    );
  }
  if (tenancy.status === "leaving") {
    return (
      <Callout variant="info" heading="You're leaving this plan">
        <Link href={`/plans/${tenancy.id}`} className="font-bold underline">
          View your notice status
        </Link>
      </Callout>
    );
  }
  return (
    <Callout variant="info" heading="Plan ended">
      This plan has ended.{" "}
      <Link href={`/plans/${tenancy.id}`} className="font-bold underline">
        View history
      </Link>
    </Callout>
  );
}

function LandlordSection({ properties }: { properties: OwnedProperty[] }) {
  const totalInvested = properties.reduce((s, p) => s + p.totalInvested, 0);
  const totalEarned = properties.reduce((s, p) => s + p.totalEarned, 0);
  const percentRecovered = totalInvested > 0 ? Math.round((totalEarned / totalInvested) * 100) : 0;

  const earnedThisMonth = properties.reduce((s, p) => {
    const last = p.monthly[p.monthly.length - 1];
    return s + (last ? last.netIncome + last.reserveContribution : 0);
  }, 0);
  const outputThisMonth = properties.reduce((s, p) => {
    const last = p.monthly[p.monthly.length - 1];
    return s + (last ? last.generationKwh : 0);
  }, 0);
  const balanceOutstanding = properties.reduce((s, p) => s + p.balanceOutstanding, 0);

  const anyAlert = properties.find((p) => p.performanceAlert || p.system?.status === "reduced");

  // Rough estimated completion, derived from recent net income trend.
  const avgMonthlyIncome =
    properties.reduce((s, p) => {
      const recent = p.monthly.slice(-3);
      const avg = recent.reduce((a, m) => a + m.netIncome + m.reserveContribution, 0) / (recent.length || 1);
      return s + avg;
    }, 0) || 1;
  const monthsRemaining = Math.max(0, Math.round(balanceOutstanding / avgMonthlyIncome));
  const estimatedCompletion = new Date();
  estimatedCompletion.setMonth(estimatedCompletion.getMonth() + monthsRemaining);

  // Aggregate income-over-time chart across all properties, by month.
  const monthTotals = new Map<string, number>();
  for (const p of properties) {
    for (const m of p.monthly) {
      monthTotals.set(m.month, (monthTotals.get(m.month) ?? 0) + m.netIncome + m.reserveContribution);
    }
  }
  const incomeSeries = Array.from(monthTotals.entries()).map(([month, netIncome]) => ({ month, netIncome }));

  return (
    <section className="mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-h2">As a landlord</h2>
          <p className="text-body text-muted mt-0.5">Asset capital recovery &amp; solar income portfolio</p>
        </div>

        {/* Cash-on-Cash Yield ROI Badge */}
        <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success-light/50 px-4 py-2 text-xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-success-darker tracking-wider block">
              Annualized Solar Cash Yield
            </span>
            <span className="text-base font-black text-success-darker">15.2% p.a.</span>
          </div>
          <div className="border-l border-success-dark/20 pl-3 text-[11px] font-medium text-success-darker">
            vs ~4.5% Bank Deposit<br />vs ~3.8% Rental Yield
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Capital Recovery Payback & Profit Intersection Line Chart (Full Width) */}
        <div className="lg:col-span-12">
          <CapitalBurndownChart
            totalInvested={totalInvested}
            totalEarned={totalEarned}
            breakEvenDate="Nov 2030"
          />
        </div>

        {/* Cash Flow Waterfall Component (7 Cols) */}
        <div className="lg:col-span-7">
          <CashflowWaterfall
            tenantSalesDollars={69}
            exportCreditsDollars={13}
            reserveDeductionDollars={18}
            monthLabel="Aug 2025"
          />
        </div>

        {/* System Status Card (5 Cols) */}
        <Card className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="text-h3">Portfolio System Status</h3>
            {anyAlert ? (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-warning-light p-3 border border-warning/30">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning-darker" aria-hidden="true" />
                <div>
                  <p className="text-[13px] font-bold text-warning-darker">Reduced output detected</p>
                  <p className="text-xs text-grey-700 mt-0.5">{formatPropertyAddress(anyAlert.address)}</p>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-success-light p-3 border border-success/20">
                <CheckCircle2 size={18} className="shrink-0 text-success" aria-hidden="true" />
                <p className="text-[13px] font-bold text-success-darker">All Systems Operating Normally</p>
              </div>
            )}
            <p className="text-xs text-grey-500 mt-4">
              Last telemetry sync:{" "}
              <span className="font-semibold text-grey-800">
                {properties[0]?.system
                  ? new Date(properties[0].system.lastReadingAt).toLocaleString("en-AU", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "—"}
              </span>
            </p>
          </div>

          <div className="mt-6 pt-3 border-t border-grey-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-grey-600">Active Assets: {properties.length} Properties</span>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1 text-[13px] font-bold text-primary hover:underline"
            >
              <Building2 size={14} aria-hidden="true" />
              Manage properties
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-line pb-2 last:border-0">
      <span className="text-grey-600">{label}</span>
      <span className={cn("tabular-nums", bold ? "font-bold text-grey-900" : "font-medium text-grey-900")}>
        {value}
      </span>
    </div>
  );
}
