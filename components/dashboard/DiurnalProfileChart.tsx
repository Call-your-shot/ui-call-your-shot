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
  TooltipProps,
} from "recharts";
import { Sparkles, SunMedium } from "lucide-react";

interface HourlyPoint {
  hour: string;
  solarKw: number;
  homeLoadKw: number;
}

const DEFAULT_24HR_PROFILE: HourlyPoint[] = [
  { hour: "00:00", solarKw: 0.0, homeLoadKw: 0.4 },
  { hour: "02:00", solarKw: 0.0, homeLoadKw: 0.3 },
  { hour: "04:00", solarKw: 0.0, homeLoadKw: 0.3 },
  { hour: "06:00", solarKw: 0.2, homeLoadKw: 0.6 },
  { hour: "08:00", solarKw: 1.8, homeLoadKw: 1.2 },
  { hour: "10:00", solarKw: 3.9, homeLoadKw: 1.5 },
  { hour: "12:00", solarKw: 4.8, homeLoadKw: 2.1 },
  { hour: "14:00", solarKw: 4.2, homeLoadKw: 1.8 },
  { hour: "16:00", solarKw: 2.4, homeLoadKw: 2.3 },
  { hour: "18:00", solarKw: 0.6, homeLoadKw: 3.2 },
  { hour: "20:00", solarKw: 0.0, homeLoadKw: 2.8 },
  { hour: "22:00", solarKw: 0.0, homeLoadKw: 1.1 },
];

export function DiurnalProfileChart({
  data = DEFAULT_24HR_PROFILE,
}: {
  data?: HourlyPoint[];
}) {
  const solarGradId = useId();
  const loadGradId = useId();

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
              24-Hour Diurnal Profile
            </span>
            <h3 className="text-h3 mt-0.5 text-grey-900">Solar Window vs Home Load</h3>
          </div>
          <div className="flex items-center gap-1 rounded-md bg-warning-light px-2 py-1 text-xs font-semibold text-warning-darker">
            <SunMedium size={13} />
            <span>Optimal Window: 9AM – 3PM</span>
          </div>
        </div>

        <p className="text-xs text-grey-600 mt-1">
          Run high-draw appliances (washing machine, dishwasher, EV charge) during peak solar production.
        </p>

        {/* Chart */}
        <div className="mt-4 h-56 w-full min-h-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 4, bottom: 0, left: -22 }}>
              <defs>
                <linearGradient id={solarGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFAB00" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#FFAB00" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id={loadGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B8D9" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00B8D9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F6F8" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: "#919EAB" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#919EAB" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}kW`}
              />
              <Tooltip content={<CustomDiurnalTooltip />} />
              <Area
                type="monotone"
                dataKey="solarKw"
                name="Solar Output"
                stroke="#FFAB00"
                strokeWidth={2.5}
                fill={`url(#${solarGradId})`}
              />
              <Area
                type="monotone"
                dataKey="homeLoadKw"
                name="Home Demand"
                stroke="#00B8D9"
                strokeWidth={2.5}
                fill={`url(#${loadGradId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-grey-200/60 pt-2.5 text-xs text-grey-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFAB00]" />
            <span className="font-semibold text-grey-900">Solar Generation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00B8D9]" />
            <span className="font-semibold text-grey-900">Household Load</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-primary font-semibold text-[11px]">
          <Sparkles size={13} />
          <span>Self-Consumed Zone</span>
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

function CustomDiurnalTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const solar = Number(payload.find((p: any) => p.dataKey === "solarKw")?.value ?? 0);
  const load = Number(payload.find((p: any) => p.dataKey === "homeLoadKw")?.value ?? 0);

  return (
    <div className="rounded-xl border border-grey-200 bg-white p-3 shadow-lg text-xs font-sans">
      <p className="font-bold text-grey-700 mb-1">{label} Telemetry</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 font-semibold text-warning-darker">
          <span>Solar Output:</span>
          <span>{solar} kW</span>
        </div>
        <div className="flex items-center justify-between gap-4 font-semibold text-info-darker">
          <span>Home Load:</span>
          <span>{load} kW</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[11px] text-grey-500 border-t border-grey-100 pt-1">
          <span>Solar Self-Coverage:</span>
          <span className="font-bold text-success">
            {solar >= load ? "100% Covered" : `${Math.round((solar / (load || 1)) * 100)}%`}
          </span>
        </div>
      </div>
    </div>
  );
}
