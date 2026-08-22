# Advanced Recharts & UI Visualization Patterns

This reference document contains ready-to-use React 19 + Recharts chart implementations designed for energy dashboards, financial modeling, Monte Carlo payback distributions, and dynamic pricing metrics.

---

## Pattern 1: Monte Carlo Payback Probability CDF Chart (Area with P05-P95 Fill & Threshold Lines)

```tsx
"use client";

import React from "react";
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

interface PaybackCdfPoint {
  years: number;
  probability: number; // 0.0 to 1.0
}

interface MonteCarloPaybackChartProps {
  data: PaybackCdfPoint[];
  medianYears?: number;
  targetYears?: number;
}

export function MonteCarloPaybackChart({
  data,
  medianYears = 7,
  targetYears = 10,
}: MonteCarloPaybackChartProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-52 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -20 }}>
            <defs>
              <linearGradient id="paybackGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00A76F" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#00A76F" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="years"
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={{ stroke: "#CBD5E1" }}
              tickFormatter={(v) => `${v} yrs`}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1.0]}
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={false}
              tickFormatter={(val) => `${Math.round(val * 100)}%`}
            />
            <Tooltip
              formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Cumulative Payback Probability"]}
              labelFormatter={(label: number) => `Year ${label}`}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(4px)",
              }}
            />
            {medianYears && (
              <ReferenceLine
                x={medianYears}
                stroke="#FFAB00"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: `Median (${medianYears} yrs)`,
                  fill: "#D97706",
                  fontSize: 11,
                  position: "top",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="probability"
              stroke="#00A76F"
              strokeWidth={2.5}
              fill="url(#paybackGlow)"
              activeDot={{ r: 6, stroke: "#00A76F", strokeWidth: 2, fill: "#FFFFFF" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

---

## Pattern 2: Dual-Axis Hourly Energy Consumption & TOU Pricing Chart

```tsx
"use client";

import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface HourlyInterval {
  hour: string; // e.g. "14:00"
  solarKwh: number;
  gridKwh: number;
  tariffRateCents: number;
}

export function HourlyEnergyTariffChart({ data }: { data: HourlyInterval[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#64748B" }} />
          <YAxis
            yAxisId="left"
            orientation="left"
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickFormatter={(val) => `${val} kWh`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "#FFAB00" }}
            tickFormatter={(val) => `${val}¢`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E2E8F0",
            }}
          />
          <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "12px" }} />
          <Bar yAxisId="left" dataKey="solarKwh" name="Solar Self-Consumed (kWh)" fill="#00A76F" radius={[4, 4, 0, 0]} stackId="a" />
          <Bar yAxisId="left" dataKey="gridKwh" name="Grid Import (kWh)" fill="#00B8D9" radius={[4, 4, 0, 0]} stackId="a" />
          <Line
            yAxisId="right"
            type="stepAfter"
            dataKey="tariffRateCents"
            name="TOU Grid Rate (¢/kWh)"
            stroke="#FFAB00"
            strokeWidth={2.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## Pattern 3: Radial Donut Chart with Centered Dynamic Metrics

```tsx
"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface SolarShareGaugeProps {
  solarSharePercentage: number; // 0 to 100
  size?: number;
}

export function SolarShareGauge({ solarSharePercentage, size = 160 }: SolarShareGaugeProps) {
  const data = [
    { name: "Solar", value: solarSharePercentage, color: "#00A76F" },
    { name: "Grid", value: Math.max(0, 100 - solarSharePercentage), color: "#E2E8F0" },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="72%"
            outerRadius="92%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-2xl font-bold text-gray-900 tracking-tight">
          {Math.round(solarSharePercentage)}%
        </span>
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          Solar Share
        </span>
      </div>
    </div>
  );
}
```
