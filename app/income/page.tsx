"use client";

import Card from "@/components/ui/Card";
import StatBlock from "@/components/ui/StatBlock";
import Button from "@/components/ui/Button";
import { useDemo } from "@/lib/demo-context";
import { formatPropertyAddress, type OwnedProperty } from "@/lib/accounts";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v);
}

export default function IncomeHistoryPage() {
  const { account } = useDemo();
  const [propertyFilter, setPropertyFilter] = useState<string>("all");

  if (account.ownedProperties.length === 0) {
    return (
      <div>
        <h1 className="text-h1">Income history</h1>
        <Card className="mt-6 flex flex-col items-center py-10 text-center">
          <p className="text-data text-success">$0</p>
          <p className="text-h3 mt-2">No income yet</p>
          <p className="text-body mt-1 max-w-sm">
            You&apos;ll see income here once you own a property with an active plan.
          </p>
          <Button href="/properties/new" className="mt-5">
            Add a property
          </Button>
        </Card>
      </div>
    );
  }

  const properties =
    propertyFilter === "all"
      ? account.ownedProperties
      : account.ownedProperties.filter((p) => p.id === propertyFilter);

  const totalEarned = properties.reduce((s, p) => s + p.totalEarned, 0);
  const totalInvested = properties.reduce((s, p) => s + p.totalInvested, 0);
  const netPosition = totalEarned - totalInvested;
  const { series, breakEvenIndex } = buildCumulativeVsInvestment(properties, totalInvested);
  const monthlyRows = properties.flatMap((p) => p.monthly.map((m) => ({ ...m, propertyLabel: formatPropertyAddress(p.address) })));

  return (
    <div>
      <h1 className="text-h1">Income history</h1>
      <p className="text-body mt-1">What your solar investment has earned, across every property.</p>

      {account.ownedProperties.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          <FilterChip active={propertyFilter === "all"} onClick={() => setPropertyFilter("all")}>
            All properties
          </FilterChip>
          {account.ownedProperties.map((p) => (
            <FilterChip key={p.id} active={propertyFilter === p.id} onClick={() => setPropertyFilter(p.id)}>
              {formatPropertyAddress(p.address)}
            </FilterChip>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card>
          <StatBlock label="Total earned" value={formatCurrency(totalEarned)} valueClassName="text-success" />
        </Card>
        <Card>
          <StatBlock label="Total invested" value={formatCurrency(totalInvested)} />
        </Card>
        <Card>
          <StatBlock
            label="Net position"
            value={`${netPosition >= 0 ? "+" : "−"}${formatCurrency(Math.abs(netPosition))}`}
            valueClassName={netPosition >= 0 ? "text-success" : "text-error"}
          />
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-h3">Cumulative income vs. investment</h2>
        <p className="text-small mt-0.5">The break-even point is marked once earnings pass what you invested.</p>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="incomeCumFill" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(v, name) => [formatCurrency(Number(v)), name === "cumulative" ? "Earned" : "Invested"]}
                contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", boxShadow: "var(--shadow-card)" }}
              />
              <Area type="monotone" dataKey="cumulative" stroke="#00A76F" strokeWidth={2.5} fill="url(#incomeCumFill)" />
              <Line type="monotone" dataKey="invested" stroke="#DFE3E8" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              {breakEvenIndex >= 0 && (
                <ReferenceDot
                  x={series[breakEvenIndex]?.month}
                  y={series[breakEvenIndex]?.cumulative}
                  r={5}
                  fill="#00A76F"
                  stroke="white"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-h3">Monthly detail</h2>
          <button className="flex items-center gap-1 text-[13px] font-bold text-primary hover:underline">
            <Download size={14} aria-hidden="true" />
            Export CSV
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-[14px]">
            <thead>
              <tr className="bg-grey-200 text-left text-[12px] font-semibold tracking-wide text-grey-600 uppercase">
                <th className="px-6 py-3">Period</th>
                {propertyFilter === "all" && account.ownedProperties.length > 1 && <th className="px-6 py-3">Property</th>}
                <th className="px-6 py-3 text-right">Generation</th>
                <th className="px-6 py-3 text-right">Tenant charge</th>
                <th className="px-6 py-3 text-right">Export credits</th>
                <th className="px-6 py-3 text-right">Reserve</th>
                <th className="px-6 py-3 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {[...monthlyRows].reverse().map((m, i, arr) => (
                <tr key={`${m.propertyLabel}-${m.month}`} className={cn("h-[60px] border-b border-dashed border-line", i === arr.length - 1 && "border-0")}>
                  <td className="px-6 font-medium">{m.month}</td>
                  {propertyFilter === "all" && account.ownedProperties.length > 1 && (
                    <td className="px-6 text-grey-600">{m.propertyLabel}</td>
                  )}
                  <td className="px-6 text-right tabular-nums text-grey-600">{m.generationKwh} kWh</td>
                  <td className="px-6 text-right tabular-nums text-grey-600">{formatCurrency(m.tenantChargeCollected)}</td>
                  <td className="px-6 text-right tabular-nums text-grey-600">{formatCurrency(m.exportCredits)}</td>
                  <td className="px-6 text-right tabular-nums text-grey-600">− {formatCurrency(m.reserveContribution)}</td>
                  <td className="px-6 text-right font-semibold tabular-nums text-success">{formatCurrency(m.netIncome)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function buildCumulativeVsInvestment(properties: OwnedProperty[], totalInvested: number) {
  const totals = new Map<string, number>();
  for (const p of properties) {
    for (const m of p.monthly) {
      totals.set(m.month, (totals.get(m.month) ?? 0) + m.netIncome + m.reserveContribution);
    }
  }
  const entries = Array.from(totals.entries());
  let running = 0;
  let breakEvenIndex = -1;
  const series = entries.map(([month, income], i) => {
    running += income;
    if (breakEvenIndex === -1 && running >= totalInvested && totalInvested > 0) breakEvenIndex = i;
    return { month, cumulative: Math.round(running), invested: totalInvested };
  });
  return { series, breakEvenIndex };
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold whitespace-nowrap",
        active ? "bg-primary text-white" : "bg-grey-200 text-grey-600"
      )}
    >
      {children}
    </button>
  );
}
