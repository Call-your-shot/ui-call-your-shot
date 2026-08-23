"use client";

import React from "react";
import Card from "@/components/ui/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { ShieldCheck, ZapOff } from "lucide-react";

interface TariffPoint {
  time: string;
  gridTariffCents: number;
  solarPpaCents: number;
  period: "Off-Peak" | "Shoulder" | "Peak";
}

const DEFAULT_TARIFF_CURVE: TariffPoint[] = [
  { time: "00:00", gridTariffCents: 16.0, solarPpaCents: 15.0, period: "Off-Peak" },
  { time: "04:00", gridTariffCents: 16.0, solarPpaCents: 15.0, period: "Off-Peak" },
  { time: "07:00", gridTariffCents: 24.0, solarPpaCents: 15.0, period: "Shoulder" },
  { time: "11:00", gridTariffCents: 24.0, solarPpaCents: 15.0, period: "Shoulder" },
  { time: "15:00", gridTariffCents: 24.0, solarPpaCents: 15.0, period: "Shoulder" },
  { time: "17:00", gridTariffCents: 38.0, solarPpaCents: 15.0, period: "Peak" },
  { time: "19:00", gridTariffCents: 38.0, solarPpaCents: 15.0, period: "Peak" },
  { time: "21:00", gridTariffCents: 24.0, solarPpaCents: 15.0, period: "Shoulder" },
  { time: "23:00", gridTariffCents: 16.0, solarPpaCents: 15.0, period: "Off-Peak" },
];

export function TariffShieldChart({
  data = DEFAULT_TARIFF_CURVE,
}: {
  data?: TariffPoint[];
}) {
  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
              Tariff Shield
            </span>
            <h3 className="text-h3 mt-0.5 text-grey-900">Peak Price Dodging</h3>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-primary-lighter px-3 py-1 text-xs font-bold text-primary-darker">
            <ShieldCheck size={14} />
            <span>Shielded from 38¢ Peak</span>
          </div>
        </div>

        <p className="text-xs text-grey-600 mt-1">
          Your flat 15¢/kWh solar PPA protects you during expensive evening peak hours (5 PM – 9 PM).
        </p>

        {/* Stepped Line Chart */}
        <div className="mt-4 h-56 w-full min-h-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 4, bottom: 0, left: -22 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F6F8" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: "#919EAB" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#919EAB" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}¢`}
                domain={[10, 45]}
              />
              <Tooltip content={<CustomTariffTooltip />} />
              <Line
                type="stepAfter"
                dataKey="gridTariffCents"
                name="Grid Retail TOU"
                stroke="#FF5630"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#FF5630" }}
              />
              <Line
                type="monotone"
                dataKey="solarPpaCents"
                name="Solar PPA Rate"
                stroke="#00A76F"
                strokeWidth={3}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: "#00A76F" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-grey-200/60 pt-2.5 text-xs text-grey-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5630]" />
            <span className="font-semibold text-grey-900">Grid TOU (16¢–38¢)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00A76F]" />
            <span className="font-semibold text-grey-900">Flat Solar PPA (15¢)</span>
          </div>
        </div>

        <span className="text-[11px] font-bold text-success">
          Save 23¢/kWh at 6 PM
        </span>
      </div>
    </Card>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomTariffTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const grid = Number(payload.find((p: any) => p.dataKey === "gridTariffCents")?.value ?? 0);
  const ppa = Number(payload.find((p: any) => p.dataKey === "solarPpaCents")?.value ?? 0);
  const diff = (grid - ppa).toFixed(1);
  const period = payload[0]?.payload?.period ?? "";

  return (
    <div className="rounded-xl border border-grey-200 bg-white p-3 shadow-lg text-xs font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-grey-100 pb-1 mb-1">
        <span className="font-bold text-grey-700">{label}</span>
        <span className="rounded bg-grey-100 px-1.5 text-[10px] font-bold text-grey-700">{period}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 font-semibold text-error">
          <span>Grid TOU Rate:</span>
          <span>{grid}¢ / kWh</span>
        </div>
        <div className="flex items-center justify-between gap-4 font-bold text-primary">
          <span>Solar PPA Rate:</span>
          <span>{ppa}¢ / kWh</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-success font-bold border-t border-grey-100 pt-1">
          <span>Rate Protection:</span>
          <span>+{diff}¢ / kWh cheaper</span>
        </div>
      </div>
    </div>
  );
}
