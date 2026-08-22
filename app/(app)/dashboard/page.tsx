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
          <Button href="/scan" fullWidth>
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

          {lastMonth && (
            <>
              <StatCard
                className="lg:col-span-4"
                icon={Wallet}
                tone="primary"
                value={formatCurrency(lastMonth.chargeDollars)}
                label="This month's bill"
              />
              <StatCard
                className="lg:col-span-4"
                icon={Zap}
                tone="success"
                value={formatCurrency(lastMonth.savingsDollars)}
                label="Saved this month"
              />
              <StatCard
                className="lg:col-span-4"
                icon={Sun}
                tone="info"
                value={`${lastMonth.solarUsedKwh} kWh`}
                label="Solar used this month"
              />

              <Card className="lg:col-span-12">
                <h3 className="text-h3">This month&apos;s bill</h3>
                <div className="mt-3 flex flex-col gap-2 text-[14px]">
                  <Row label="Solar charge" value={formatCurrency(lastMonth.solarUsedKwh * (tenancy.ratePerKwhCents / 100))} />
                  <Row
                    label="Grid charge"
                    value={formatCurrency(lastMonth.chargeDollars - lastMonth.solarUsedKwh * (tenancy.ratePerKwhCents / 100))}
                  />
                  <Row label="Total" value={formatCurrency(lastMonth.chargeDollars)} bold />
                </div>
                <div className="mt-3 rounded-lg bg-success-light p-3 text-[13px] font-medium text-success">
                  Without solar you&apos;d have paid {formatCurrency(lastMonth.withoutSolarDollars)}.
                </div>
              </Card>
            </>
          )}

          <Card className="lg:col-span-12">
            <h3 className="text-h3">Savings over time</h3>
            <p className="text-body mt-0.5">Last 12 months.</p>
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tenancy.monthly} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="tenantSavingsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00A76F" stopOpacity={0.24} />
                      <stop offset="100%" stopColor="#00A76F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#F4F6F8" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(m: string) => m.split(" ")[0][0]}
                    tick={{ fontSize: 12, fill: "#919EAB" }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v)), "Saved"]}
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", boxShadow: "var(--shadow-card)" }}
                  />
                  <Area type="monotone" dataKey="savingsDollars" stroke="#00A76F" strokeWidth={2.5} fill="url(#tenantSavingsFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="lg:col-span-12">
            <Link href={`/plans/${tenancy.id}`} className="text-[13px] font-bold text-primary hover:underline">
              View full plan details →
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
        <Link href="/scan" className="font-bold underline">
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
      <h2 className="text-h2">As a landlord</h2>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-12">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[13px] font-semibold tracking-wide text-grey-600 uppercase">
                Total invested
              </p>
              <p className="text-data mt-1">{formatCurrency(totalInvested)}</p>
            </div>
            <div>
              <p className="text-[13px] font-semibold tracking-wide text-grey-600 uppercase">
                Total earned
              </p>
              <p className="text-data mt-1 text-success">{formatCurrency(totalEarned)}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-grey-600">
              <span>{percentRecovered}% recovered</span>
              <span>
                Est. complete{" "}
                {estimatedCompletion.toLocaleDateString("en-AU", { month: "short", year: "numeric" })}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-grey-300">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${Math.min(100, percentRecovered)}%` }}
              />
            </div>
          </div>
        </Card>

        <StatCard
          className="lg:col-span-4"
          icon={Wallet}
          tone="success"
          value={formatCurrency(earnedThisMonth)}
          label="Earned this month"
        />
        <StatCard
          className="lg:col-span-4"
          icon={Battery}
          tone="info"
          value={`${Math.round(outputThisMonth)} kWh`}
          label="System output this month"
        />
        <StatCard
          className="lg:col-span-4"
          icon={Wallet}
          tone="primary"
          value={formatCurrency(balanceOutstanding)}
          label="Balance outstanding"
        />

        <Card className="lg:col-span-8">
          <h3 className="text-h3">Income over time</h3>
          <p className="text-body mt-0.5">Last 12 months, across all properties.</p>
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={incomeSeries} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00A76F" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#00A76F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#F4F6F8" strokeDasharray="4 4" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(m: string) => m.split(" ")[0][0]}
                  tick={{ fontSize: 12, fill: "#919EAB" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v)), "Net income"]}
                  contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", boxShadow: "var(--shadow-card)" }}
                />
                <Area type="monotone" dataKey="netIncome" stroke="#00A76F" strokeWidth={2.5} fill="url(#incomeFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <h3 className="text-h3">System status</h3>
          {anyAlert ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-warning-light p-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
              <div>
                <p className="text-[13px] font-semibold text-warning">Reduced output detected</p>
                <p className="text-small mt-0.5">{formatPropertyAddress(anyAlert.address)}</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-success-light p-3">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
              <p className="text-[13px] font-semibold text-success">Operating normally</p>
            </div>
          )}
          <p className="text-small mt-3">
            Last reading{" "}
            {properties[0]?.system
              ? new Date(properties[0].system.lastReadingAt).toLocaleString("en-AU", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "—"}
          </p>
          <Link
            href="/properties"
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-primary hover:underline"
          >
            <Building2 size={14} aria-hidden="true" />
            View all properties
          </Link>
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
