"use client";

import React, { useId } from "react";
import Card from "@/components/ui/Card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { CheckCircle2, TrendingUp, Target } from "lucide-react";

interface PaybackPoint {
  date: string;
  unrecoveredCost: number;
  cumulativeProfit: number;
  isCurrent?: boolean;
  isBreakEven?: boolean;
}

interface CapitalBurndownProps {
  totalInvested?: number;
  totalEarned?: number;
  breakEvenDate?: string;
  data?: PaybackPoint[];
}

const DEFAULT_PAYBACK_SERIES: PaybackPoint[] = [
  { date: "Feb 2023", unrecoveredCost: 6700, cumulativeProfit: 0 },
  { date: "Aug 2023", unrecoveredCost: 6150, cumulativeProfit: 550 },
  { date: "Feb 2024", unrecoveredCost: 5500, cumulativeProfit: 1200 },
  { date: "Aug 2024", unrecoveredCost: 4800, cumulativeProfit: 1900 },
  { date: "Feb 2025", unrecoveredCost: 4200, cumulativeProfit: 2500 },
  { date: "Aug 2025", unrecoveredCost: 3885, cumulativeProfit: 2815, isCurrent: true },
  { date: "Feb 2026", unrecoveredCost: 3300, cumulativeProfit: 3400 },
  { date: "Aug 2026", unrecoveredCost: 2700, cumulativeProfit: 4000 },
  { date: "Feb 2027", unrecoveredCost: 2100, cumulativeProfit: 4600 },
  { date: "Aug 2027", unrecoveredCost: 1500, cumulativeProfit: 5200 },
  { date: "Feb 2028", unrecoveredCost: 900, cumulativeProfit: 5800 },
  { date: "Aug 2028", unrecoveredCost: 300, cumulativeProfit: 6400 },
  { date: "Nov 2030", unrecoveredCost: 0, cumulativeProfit: 6700, isBreakEven: true },
  { date: "Feb 2031", unrecoveredCost: 0, cumulativeProfit: 7400 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export function CapitalBurndownChart({
  totalInvested = 6700,
  totalEarned = 2815,
  breakEvenDate = "Nov 2030",
  data = DEFAULT_PAYBACK_SERIES,
}: CapitalBurndownProps) {
  const profitGradId = useId();
  const costGradId = useId();
  const unrecovered = totalInvested - totalEarned;
  const percentRecovered = Math.round((totalEarned / totalInvested) * 100);

  return (
    <Card className="flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
                Payback &amp; Profit Intersection
              </span>
              <span className="rounded bg-success-light px-2 py-0.5 text-[11px] font-extrabold text-success">
                {percentRecovered}% Paid Off
              </span>
            </div>
            <h3 className="text-h3 mt-0.5 text-grey-900">Capital Recovery Burn-Down</h3>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary-lighter/40 px-3 py-1.5 text-xs font-bold text-primary-darker">
            <Target size={14} className="text-primary animate-pulse" />
            <span>Break-Even: {breakEvenDate}</span>
          </div>
        </div>

        {/* Financial Stat Strip */}
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-grey-200/80 bg-grey-50 p-3">
          <div>
            <p className="text-[11px] font-medium text-grey-500">Initial Outlay</p>
            <p className="text-base font-black text-grey-900">${totalInvested.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-success">Recovered to Date</p>
            <p className="flex items-center text-base font-black text-success">
              <CheckCircle2 size={15} className="mr-1 shrink-0" />
              ${totalEarned.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-error">Unrecovered Balance</p>
            <p className="text-base font-black text-error">${unrecovered.toLocaleString()}</p>
          </div>
        </div>

        {/* Dual Line / Area Chart */}
        <div className="mt-5 h-64 w-full min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id={profitGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A76F" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00A76F" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id={costGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF5630" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FF5630" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F6F8" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#919EAB" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#919EAB" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<CustomPaybackTooltip />} />

              <ReferenceLine x={breakEvenDate} stroke="#00A76F" strokeDasharray="3 3" label={{ value: "Break-Even Target", fill: "#00A76F", fontSize: 10, fontWeight: "bold" }} />

              <Area
                type="monotone"
                dataKey="unrecoveredCost"
                name="Unrecovered Outlay"
                stroke="#FF5630"
                strokeWidth={2.5}
                fill={`url(#${costGradId})`}
              />
              <Area
                type="monotone"
                dataKey="cumulativeProfit"
                name="Cumulative Profit"
                stroke="#00A76F"
                strokeWidth={3}
                fill={`url(#${profitGradId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-grey-200/60 pt-2.5 text-xs text-grey-600">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5630]" />
            <span className="font-semibold text-grey-900">Unrecovered Outlay</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00A76F]" />
            <span className="font-semibold text-grey-900">Cumulative Cash Earned</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-success font-bold text-[11px]">
          <TrendingUp size={14} />
          <span>Intersection = 100% Payoff</span>
        </div>
      </div>
    </Card>
  );
}

function CustomPaybackTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const cost = Number(payload.find((p: any) => p.dataKey === "unrecoveredCost")?.value ?? 0);
  const profit = Number(payload.find((p: any) => p.dataKey === "cumulativeProfit")?.value ?? 0);
  const isCurrent = payload[0]?.payload?.isCurrent;
  const isBreakEven = payload[0]?.payload?.isBreakEven;

  return (
    <div className="rounded-xl border border-grey-200 bg-white p-3 shadow-lg text-xs font-sans">
      <div className="flex items-center justify-between gap-3 border-b border-grey-100 pb-1 mb-1">
        <span className="font-bold text-grey-800">{label}</span>
        {isCurrent && <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">Current Month</span>}
        {isBreakEven && <span className="rounded bg-success px-1.5 py-0.5 text-[10px] font-bold text-white">🎯 Break-Even Target</span>}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 font-semibold text-error">
          <span>Unrecovered Outlay:</span>
          <span>${cost.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-4 font-bold text-success">
          <span>Cumulative Earned:</span>
          <span>${profit.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
