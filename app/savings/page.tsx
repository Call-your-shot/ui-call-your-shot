"use client";

import Card from "@/components/ui/Card";
import StatBlock from "@/components/ui/StatBlock";
import Button from "@/components/ui/Button";
import { useDemo } from "@/lib/demo-context";
import { formatPropertyAddress, totalSavingsToDate, type Tenancy } from "@/lib/accounts";
import { cn } from "@/lib/utils";
import { NEW_ASSESSMENT_HREF } from "@/lib/billFlow";
import { Download } from "lucide-react";
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
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v);
}

export default function SavingsHistoryPage() {
  const { account } = useDemo();
  const [propertyFilter, setPropertyFilter] = useState<string>("all");

  if (account.tenancies.length === 0) {
    return (
      <div>
        <h1 className="text-h1">Savings history</h1>
        <Card className="mt-6 flex flex-col items-center py-10 text-center">
          <p className="text-data text-success">$0</p>
          <p className="text-h3 mt-2">No savings yet</p>
          <p className="text-body mt-1 max-w-sm">
            You&apos;ll see your savings here once you have an active solar plan.
          </p>
          <Button href={NEW_ASSESSMENT_HREF} className="mt-5">
            Start an assessment
          </Button>
        </Card>
      </div>
    );
  }

  const tenancies =
    propertyFilter === "all"
      ? account.tenancies
      : account.tenancies.filter((t) => t.id === propertyFilter);

  const totalSaved = tenancies.reduce((s, t) => s + totalSavingsToDate(t), 0);
  const cumulative = buildCumulative(tenancies);
  const monthlyRows = tenancies.flatMap((t) => t.monthly.map((m) => ({ ...m, propertyLabel: formatPropertyAddress(t.address) })));

  return (
    <div>
      <h1 className="text-h1">Savings history</h1>
      <p className="text-body mt-1">What solar has saved you, across every plan.</p>

      {account.tenancies.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          <FilterChip active={propertyFilter === "all"} onClick={() => setPropertyFilter("all")}>
            All properties
          </FilterChip>
          {account.tenancies.map((t) => (
            <FilterChip key={t.id} active={propertyFilter === t.id} onClick={() => setPropertyFilter(t.id)}>
              {formatPropertyAddress(t.address)}
            </FilterChip>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <StatBlock label="Total saved, all time" value={formatCurrency(totalSaved)} valueClassName="text-success" />
      </Card>

      <Card className="mt-6">
        <h2 className="text-h3">Cumulative savings</h2>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulative} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="savingsCumFill" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(v) => [formatCurrency(Number(v)), "Total saved"]}
                contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", boxShadow: "var(--shadow-card)" }}
              />
              <Area type="monotone" dataKey="total" stroke="#00A76F" strokeWidth={2.5} fill="url(#savingsCumFill)" />
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
          <table className="w-full min-w-[640px] border-collapse text-[14px]">
            <thead>
              <tr className="bg-grey-200 text-left text-[12px] font-semibold tracking-wide text-grey-600 uppercase">
                <th className="px-6 py-3">Period</th>
                {propertyFilter === "all" && account.tenancies.length > 1 && <th className="px-6 py-3">Property</th>}
                <th className="px-6 py-3 text-right">Solar used</th>
                <th className="px-6 py-3 text-right">Grid used</th>
                <th className="px-6 py-3 text-right">Charged</th>
                <th className="px-6 py-3 text-right">Counterfactual</th>
                <th className="px-6 py-3 text-right">Saved</th>
              </tr>
            </thead>
            <tbody>
              {[...monthlyRows].reverse().map((m, i, arr) => (
                <tr key={`${m.propertyLabel}-${m.month}`} className={cn("h-[60px] border-b border-dashed border-line", i === arr.length - 1 && "border-0")}>
                  <td className="px-6 font-medium">{m.month}</td>
                  {propertyFilter === "all" && account.tenancies.length > 1 && (
                    <td className="px-6 text-grey-600">{m.propertyLabel}</td>
                  )}
                  <td className="px-6 text-right tabular-nums text-grey-600">{m.solarUsedKwh} kWh</td>
                  <td className="px-6 text-right tabular-nums text-grey-600">{m.gridUsedKwh} kWh</td>
                  <td className="px-6 text-right tabular-nums text-grey-600">{formatCurrency(m.chargeDollars)}</td>
                  <td className="px-6 text-right tabular-nums text-grey-600">{formatCurrency(m.withoutSolarDollars)}</td>
                  <td className="px-6 text-right font-semibold tabular-nums text-success">{formatCurrency(m.savingsDollars)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function buildCumulative(tenancies: Tenancy[]) {
  const totals = new Map<string, number>();
  for (const t of tenancies) {
    for (const m of t.monthly) {
      totals.set(m.month, (totals.get(m.month) ?? 0) + m.savingsDollars);
    }
  }
  const entries = Array.from(totals.entries());
  let running = 0;
  return entries.map(([month, savings]) => {
    running += savings;
    return { month, total: Math.round(running) };
  });
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
