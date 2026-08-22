"use client";

import React, { useId } from "react";
import Card from "@/components/ui/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from "recharts";
import { ArrowDownRight, TrendingDown } from "lucide-react";

interface MonthlyBillComparison {
  month: string;
  gridOnly: number;
  actualBill: number;
  savings: number;
}

interface BillShockKillerProps {
  data?: MonthlyBillComparison[];
  currentMonthGridOnly?: number;
  currentMonthActual?: number;
  currentMonthSaved?: number;
}

const DEFAULT_MONTHS: MonthlyBillComparison[] = [
  { month: "Mar", gridOnly: 110, actualBill: 34, savings: 76 },
  { month: "Apr", gridOnly: 105, actualBill: 32, savings: 73 },
  { month: "May", gridOnly: 115, actualBill: 38, savings: 77 },
  { month: "Jun", gridOnly: 130, actualBill: 45, savings: 85 },
  { month: "Jul", gridOnly: 125, actualBill: 42, savings: 83 },
  { month: "Aug", gridOnly: 118, actualBill: 32, savings: 86 },
];

export function BillShockKiller({
  data = DEFAULT_MONTHS,
  currentMonthGridOnly = 118,
  currentMonthActual = 32,
  currentMonthSaved = 86,
}: BillShockKillerProps) {
  const percentageSaved = Math.round((currentMonthSaved / currentMonthGridOnly) * 100);

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
              Financial Comparison
            </span>
            <h3 className="text-h3 mt-0.5 text-grey-900">The Bill Shock Killer</h3>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-success-light px-3 py-1 text-xs font-bold text-success">
            <TrendingDown size={14} />
            <span>{percentageSaved}% Savings</span>
          </div>
        </div>

        {/* Current Month Highlight Box */}
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-grey-200/80 bg-grey-50 p-3">
          <div>
            <p className="text-[11px] font-medium text-grey-500">Without Solar</p>
            <p className="text-base font-bold text-grey-400 line-through">
              ${currentMonthGridOnly}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-grey-500">PPA Bill Paid</p>
            <p className="text-base font-bold text-primary">${currentMonthActual}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-success">Net Savings</p>
            <p className="flex items-center text-base font-black text-success">
              <ArrowDownRight size={16} className="mr-0.5 shrink-0" />
              ${currentMonthSaved}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="mt-5 h-52 w-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -22 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F6F8" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#919EAB" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#919EAB" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<CustomBillTooltip />} />
              <Bar dataKey="gridOnly" name="Without Solar" fill="#C4CDD5" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar dataKey="actualBill" name="With SunShare" fill="#00A76F" radius={[4, 4, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-6 border-t border-grey-200/60 pt-2.5 text-xs text-grey-600">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#C4CDD5]" />
          <span>Grid Baseline</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#00A76F]" />
          <span className="font-semibold text-grey-900">SunShare PPA Bill</span>
        </div>
      </div>
    </Card>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomBillTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const gridVal = Number(payload.find((p: any) => p.dataKey === "gridOnly")?.value ?? 0);
  const actualVal = Number(payload.find((p: any) => p.dataKey === "actualBill")?.value ?? 0);
  const saved = gridVal - actualVal;

  return (
    <div className="rounded-xl border border-grey-200 bg-white p-3 shadow-lg text-xs font-sans">
      <p className="font-bold text-grey-700 mb-1">{label} Statement</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-grey-500">
          <span>Grid Baseline:</span>
          <span className="line-through">${gridVal}</span>
        </div>
        <div className="flex items-center justify-between gap-4 font-bold text-primary">
          <span>SunShare Bill:</span>
          <span>${actualVal}</span>
        </div>
        <div className="flex items-center justify-between gap-4 font-bold text-success border-t border-grey-100 pt-1">
          <span>Saved:</span>
          <span>+${saved}</span>
        </div>
      </div>
    </div>
  );
}
