"use client";

import React, { useId } from "react";
import Card from "@/components/ui/Card";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface MonthlyRecord {
  month: string;
  solarUsedKwh: number;
  gridUsedKwh: number;
  chargeDollars: number;
  savingsDollars: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export function PlanHistoryChart({
  monthlyData,
}: {
  monthlyData: MonthlyRecord[];
}) {
  const solarGradId = useId();

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
              Historical Performance
            </span>
            <h3 className="text-h3 mt-0.5 text-grey-900">12-Month Solar vs. Grid Usage</h3>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-success-light px-3 py-1 text-xs font-bold text-success">
            <TrendingUp size={14} />
            <span>Consistent Savings</span>
          </div>
        </div>

        {/* Recharts Composed Chart */}
        <div className="mt-5 h-64 w-full min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData} margin={{ top: 10, right: 12, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id={solarGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A76F" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00A76F" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F6F8" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#919EAB" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="kwh"
                tick={{ fontSize: 11, fill: "#919EAB" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}k`}
              />
              <YAxis
                yAxisId="dollars"
                orientation="right"
                tick={{ fontSize: 11, fill: "#00A76F" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<CustomPlanHistoryTooltip />} />
              <Bar yAxisId="kwh" dataKey="solarUsedKwh" name="Solar Used (kWh)" fill="#00A76F" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar yAxisId="kwh" dataKey="gridUsedKwh" name="Grid Used (kWh)" fill="#C4CDD5" radius={[4, 4, 0, 0]} barSize={14} />
              <Line
                yAxisId="dollars"
                type="monotone"
                dataKey="savingsDollars"
                name="Savings ($)"
                stroke="#00A76F"
                strokeWidth={3}
                dot={{ r: 4, fill: "#00A76F" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-6 border-t border-grey-200/60 pt-2.5 text-xs text-grey-600">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#00A76F]" />
          <span className="font-semibold text-grey-900">Solar Used (kWh)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#C4CDD5]" />
          <span className="font-semibold text-grey-900">Grid Used (kWh)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#00A76F]" />
          <span className="font-bold text-success">Monthly Savings ($)</span>
        </div>
      </div>
    </Card>
  );
}

function CustomPlanHistoryTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const solarKwh = Number(payload.find((p: any) => p.dataKey === "solarUsedKwh")?.value ?? 0);
  const gridKwh = Number(payload.find((p: any) => p.dataKey === "gridUsedKwh")?.value ?? 0);
  const savedDollars = Number(payload.find((p: any) => p.dataKey === "savingsDollars")?.value ?? 0);

  return (
    <div className="rounded-xl border border-grey-200 bg-white p-3 shadow-lg text-xs font-sans">
      <p className="font-bold text-grey-700 mb-1">{label} Statement Summary</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 font-semibold text-primary">
          <span>Solar Consumed:</span>
          <span>{solarKwh} kWh</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-grey-600">
          <span>Grid Imported:</span>
          <span>{gridKwh} kWh</span>
        </div>
        <div className="flex items-center justify-between gap-4 font-bold text-success border-t border-grey-100 pt-1">
          <span>Net Savings:</span>
          <span>+${savedDollars}</span>
        </div>
      </div>
    </div>
  );
}
