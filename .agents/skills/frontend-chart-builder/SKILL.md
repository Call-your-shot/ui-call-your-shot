---
name: frontend-chart-builder
description: Best practices, design patterns, Recharts React 19 visual guidelines, custom tooltips, gradients, and responsive chart components for modern web frontends. Trigger whenever writing, designing, or refactoring frontend charts, visual analytics, dashboard graphs, energy/financial metrics visualizations, or Recharts components.
---

# Frontend Chart & Visualization Skill Guide

This skill provides design standards, implementation patterns, and code blueprints for building visual analytics, interactive graphs, and financial/energy charts in React 19 + Next.js apps using Recharts and Tailwind CSS.

---

## 1. Core Principles for High-Impact Charts

1. **Design System Integration**: Never use default browser fonts or raw unstyled SVG elements. Match spacing, colors, radiuses, and shadows to the UI design system.
2. **Gradients & Depth**: Use SVG `<defs>` with `<linearGradient>` to give area and bar charts subtle vertical fading and visual polish.
3. **Custom HTML Tooltips**: Avoid raw Recharts default tooltips. Pass a custom React component to `Tooltip content={<CustomTooltip />}` styled with Tailwind, subtle shadows, and formatted numbers.
4. **Responsive Container Safety**: Wrap charts in `<ResponsiveContainer width="100%" height="100%">` inside a parent container with fixed/min height (e.g. `min-h-[280px]`) to avoid 0-pixel height collapse issues in flexbox grid layouts.
5. **React 19 & Next.js Compatibility**: Always include `"use client";` at top of chart components. Use `useState` or `useId` for SVG gradient IDs to prevent hydration mismatch when rendered concurrently.

---

## 2. Recommended Color Palette Tokens

| Purpose | Light Mode Color | Dark/Muted Variant | Gradient Fill |
| :--- | :--- | :--- | :--- |
| **Primary / Solar** | `#00A76F` (Emerald) | `#05C46B` | `stopOpacity={0.45}` -> `stopOpacity={0.0}` |
| **Secondary / Grid** | `#00B8D9` (Cyan/Sky) | `#00D2D3` | `stopOpacity={0.40}` -> `stopOpacity={0.0}` |
| **Warning / Peak** | `#FFAB00` (Amber) | `#FFC048` | `stopOpacity={0.50}` -> `stopOpacity={0.0}` |
| **Error / Export** | `#FF5630` (Coral/Red) | `#FF7675` | `stopOpacity={0.45}` -> `stopOpacity={0.0}` |
| **Grid Lines** | `#DFE3E8` | `#334155` | `strokeDasharray="3 3"` |

---

## 3. Chart Implementation Patterns

### Pattern A: Smooth Gradient Area Chart with Custom Tooltip

```tsx
"use client";

import React, { useId } from "react";
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

interface DataPoint {
  label: string;
  value: number;
  baseline?: number;
}

interface AreaChartProps {
  data: DataPoint[];
  unit?: string;
  valueFormatter?: (val: number) => string;
}

export function PremiumAreaChart({
  data,
  unit = "",
  valueFormatter = (v) => `${v}${unit}`,
}: AreaChartProps) {
  const gradientId = useId();

  return (
    <div className="h-64 w-full min-h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: -16 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00A76F" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#00A76F" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#DFE3E8" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#637381" }}
            axisLine={{ stroke: "#DFE3E8" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#637381" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={valueFormatter}
          />
          <Tooltip content={<CustomChartTooltip formatter={valueFormatter} />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#00A76F"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 6, stroke: "#00A76F", strokeWidth: 2, fill: "#FFFFFF" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomChartTooltip({ active, payload, label, formatter }: TooltipProps<number, string> & { formatter: (val: number) => string }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-md transition-all text-xs font-sans">
      <p className="font-medium text-gray-500 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}:</span>
          <span className="ml-auto font-bold">{formatter(Number(entry.value))}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## 4. Specialized Energy & Financial Charts

For full code examples of:
- **Monte Carlo Payback CDF/PDF Confidence Interval Area Chart**
- **Dual-Axis Hourly TOU Generation vs Tariff Rate Chart**
- **Donut / Radial Solar Self-Consumption Gauge**

See the reference document: [recharts-patterns.md](file://./references/recharts-patterns.md)
