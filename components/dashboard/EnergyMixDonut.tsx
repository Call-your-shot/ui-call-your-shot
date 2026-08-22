"use client";

import React from "react";
import Card from "@/components/ui/Card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, TooltipProps } from "recharts";
import { Sun, Battery, Zap } from "lucide-react";

interface EnergyMixItem {
  name: string;
  value: number; // kWh
  percentage: number;
  color: string;
  rate: string;
}

interface EnergyMixDonutProps {
  solarKwh?: number;
  batteryKwh?: number;
  gridKwh?: number;
}

export function EnergyMixDonut({
  solarKwh = 210,
  batteryKwh = 110,
  gridKwh = 85,
}: EnergyMixDonutProps) {
  const totalKwh = solarKwh + batteryKwh + gridKwh;
  const solarPct = Math.round((solarKwh / totalKwh) * 100);
  const batteryPct = Math.round((batteryKwh / totalKwh) * 100);
  const gridPct = 100 - solarPct - batteryPct;

  const data: EnergyMixItem[] = [
    { name: "Direct Solar PPA", value: solarKwh, percentage: solarPct, color: "#00A76F", rate: "15.0¢/kWh" },
    { name: "Stored Battery Energy", value: batteryKwh, percentage: batteryPct, color: "#00B8D9", rate: "15.0¢/kWh" },
    { name: "Grid Import", value: gridKwh, percentage: gridPct, color: "#FF5630", rate: "33.0¢/kWh" },
  ];

  const cleanEnergyPct = solarPct + batteryPct;

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
              Monthly Energy Mix (30 Days)
            </span>
            <h3 className="text-h3 mt-0.5 text-grey-900">Where Your Power Came From</h3>
          </div>
          <span className="rounded-lg bg-primary-lighter px-2.5 py-1 text-xs font-black text-primary-darker">
            {cleanEnergyPct}% Solar &amp; Battery Monthly
          </span>
        </div>

        {/* Donut Chart with Center Label */}
        <div className="relative mt-4 h-48 w-full min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomDonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-grey-900">{totalKwh}</span>
            <span className="text-[10px] font-semibold text-grey-500 uppercase">kWh Used</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="mt-2 space-y-2 border-t border-grey-200/60 pt-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#00A76F] text-white">
                <Sun size={8} />
              </span>
              <span className="font-semibold text-grey-800">Direct Solar</span>
              <span className="rounded bg-grey-100 px-1.5 text-[10px] text-grey-600 font-mono">15¢</span>
            </div>
            <span className="font-bold text-grey-900">{solarKwh} kWh ({solarPct}%)</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#00B8D9] text-white">
                <Battery size={8} />
              </span>
              <span className="font-semibold text-grey-800">Battery Discharge</span>
              <span className="rounded bg-grey-100 px-1.5 text-[10px] text-grey-600 font-mono">15¢</span>
            </div>
            <span className="font-bold text-grey-900">{batteryKwh} kWh ({batteryPct}%)</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#FF5630] text-white">
                <Zap size={8} />
              </span>
              <span className="font-semibold text-grey-800">Grid Import</span>
              <span className="rounded bg-grey-100 px-1.5 text-[10px] text-grey-600 font-mono">33¢</span>
            </div>
            <span className="font-bold text-grey-900">{gridKwh} kWh ({gridPct}%)</span>
          </div>
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

function CustomDonutTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload as EnergyMixItem;

  return (
    <div className="rounded-xl border border-grey-200 bg-white p-2.5 shadow-lg text-xs font-sans">
      <div className="flex items-center gap-2 font-bold" style={{ color: item.color }}>
        <span>{item.name}</span>
      </div>
      <p className="mt-1 font-extrabold text-grey-900 text-sm">{item.value} kWh ({item.percentage}%)</p>
      <p className="text-[10px] text-grey-500">Tariff: {item.rate}</p>
    </div>
  );
}
