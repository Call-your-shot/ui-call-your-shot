"use client";

import React from "react";
import Card from "@/components/ui/Card";
import { CheckCircle2, AlertTriangle, ShieldCheck, Activity } from "lucide-react";

interface SystemHealthGaugeProps {
  efficiencyPercent?: number;
  todayGenerationKwh?: number;
  currentOutputKw?: number;
  inverterModel?: string;
  warrantyExpiry?: string;
  hasAlert?: boolean;
  alertMessage?: string;
  lastReadingAt?: string;
}

export function SystemHealthGauge({
  efficiencyPercent = 96,
  todayGenerationKwh = 24.6,
  currentOutputKw = 3.2,
  inverterModel = "Fronius Primo 7.0-1",
  warrantyExpiry = "1 Feb 2033",
  hasAlert = false,
  alertMessage,
  lastReadingAt = "Today, 2:30 PM",
}: SystemHealthGaugeProps) {
  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
              System Diagnostics
            </span>
            <h3 className="text-h3 mt-0.5 text-grey-900">Health &amp; Output Ratio</h3>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-success-light px-3 py-1 text-xs font-bold text-success">
            <CheckCircle2 size={14} />
            <span>{efficiencyPercent}% Efficiency</span>
          </div>
        </div>

        {/* Gauge & Metrics Grid */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 items-center">
          {/* Radial Meter Visual */}
          <div className="relative flex flex-col items-center justify-center rounded-xl bg-grey-50 p-4 border border-grey-200/60">
            <div className="relative h-24 w-24 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(#00A76F 0deg ${efficiencyPercent * 3.6}deg, #DFE3E8 ${efficiencyPercent * 3.6}deg 360deg)`
              }}
            >
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white shadow-sm">
                <span className="text-xl font-black text-grey-900">{efficiencyPercent}%</span>
                <span className="text-[9px] font-bold text-grey-500 uppercase">Output Ratio</span>
              </div>
            </div>
            <span className="mt-2 text-xs font-semibold text-grey-700">96% of Expected Yield</span>
          </div>

          {/* Today Output Metrics */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-lg border border-grey-200/60 p-2.5 text-xs">
              <span className="text-grey-600 font-medium">Today&apos;s Generation</span>
              <span className="font-extrabold text-grey-900">{todayGenerationKwh} kWh</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-grey-200/60 p-2.5 text-xs">
              <span className="text-grey-600 font-medium">Current Live Output</span>
              <span className="font-extrabold text-primary">{currentOutputKw} kW</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-grey-200/60 p-2.5 text-xs">
              <span className="text-grey-600 font-medium">Inverter Warranty</span>
              <span className="font-bold text-success flex items-center gap-1">
                <ShieldCheck size={13} />
                Until {warrantyExpiry}
              </span>
            </div>
          </div>
        </div>

        {/* Alert Status */}
        {hasAlert ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-warning-light p-3 border border-warning/30 text-xs">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning-darker" />
            <div>
              <p className="font-bold text-warning-darker">Output Alert</p>
              <p className="text-grey-700 mt-0.5">{alertMessage ?? "Output below target for 3 consecutive days."}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-success-light/60 p-2.5 px-3 border border-success-light text-xs">
            <div className="flex items-center gap-2 font-bold text-success-darker">
              <Activity size={15} />
              <span>Inverter ({inverterModel}) Operating Normally</span>
            </div>
            <span className="text-[11px] text-grey-500 font-medium">{lastReadingAt}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
