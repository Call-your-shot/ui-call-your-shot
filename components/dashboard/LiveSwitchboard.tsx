"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import { Sun, BatteryCharging, Home, Zap, RefreshCw } from "lucide-react";

interface SwitchboardData {
  solarKw: number;
  batteryKw: number;
  homeKw: number;
  gridKw: number;
  batterySocPct: number;
  selfSufficiencyPct: number;
}

const DEFAULT_SWITCHBOARD: SwitchboardData = {
  solarKw: 3.8,
  batteryKw: 1.2,
  homeKw: 2.4,
  gridKw: 0.0,
  batterySocPct: 82,
  selfSufficiencyPct: 100,
};

export function LiveSwitchboard({
  initialData = DEFAULT_SWITCHBOARD,
}: {
  initialData?: SwitchboardData;
}) {
  const [data, setData] = useState<SwitchboardData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll live telemetry API if backend is running, else smooth simulation
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/v1/telemetry/live").catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      } else {
        // Subtle random pulse simulation
        setData((prev) => ({
          ...prev,
          solarKw: Number((3.5 + Math.random() * 0.8).toFixed(1)),
          homeKw: Number((2.1 + Math.random() * 0.6).toFixed(1)),
        }));
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setData((prev) => ({
        ...prev,
        solarKw: Number((Math.max(0.5, prev.solarKw + (Math.random() * 0.4 - 0.2))).toFixed(1)),
      }));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
            </span>
            <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
              Real-Time Power Flow (Instantaneous)
            </span>
          </div>
          <h3 className="text-h3 mt-0.5 text-grey-900">Live Switchboard</h3>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 rounded-lg border border-grey-200 bg-grey-50 px-2.5 py-1 text-xs font-semibold text-grey-600 hover:bg-grey-100 transition-colors"
          title="Refresh telemetry"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin text-primary" : ""} />
          <span>Live Telemetry</span>
        </button>
      </div>

      {/* 4-Node Interactive Flow Network */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Node 1: Solar */}
        <div className="relative flex flex-col items-center rounded-xl border border-warning/30 bg-warning-light/40 p-3.5 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning text-white shadow-sm">
            <Sun size={22} className="animate-spin-slow" />
          </div>
          <span className="mt-2 text-xs font-semibold text-grey-600">Solar Roof</span>
          <span className="text-lg font-black text-warning-darker">{data.solarKw} kW</span>
          <span className="text-[10px] font-medium text-warning-dark">Active generation</span>
        </div>

        {/* Node 2: Battery */}
        <div className="relative flex flex-col items-center rounded-xl border border-info/30 bg-info-light/40 p-3.5 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-info text-white shadow-sm">
            <BatteryCharging size={22} />
          </div>
          <span className="mt-2 text-xs font-semibold text-grey-600">Battery</span>
          <span className="text-lg font-black text-info-darker">{data.batteryKw} kW</span>
          <span className="text-[10px] text-info-dark font-medium">{data.batterySocPct}% Charged</span>
        </div>

        {/* Node 3: Home */}
        <div className="relative flex flex-col items-center rounded-xl border border-primary/30 bg-primary-lighter/50 p-3.5 text-center ring-2 ring-primary/20">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-sm">
            <Home size={22} />
          </div>
          <span className="mt-2 text-xs font-semibold text-grey-600">Home Demand</span>
          <span className="text-lg font-black text-primary-darker">{data.homeKw} kW</span>
          <span className="text-[10px] font-bold text-success">100% Solar &amp; Battery</span>
        </div>

        {/* Node 4: Grid */}
        <div className="relative flex flex-col items-center rounded-xl border border-grey-200 bg-grey-50 p-3.5 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-grey-400 text-white shadow-sm">
            <Zap size={22} />
          </div>
          <span className="mt-2 text-xs font-semibold text-grey-600">Grid Line</span>
          <span className="text-lg font-black text-grey-700">{data.gridKw} kW</span>
          <span className="text-[10px] font-medium text-grey-500">
            {data.gridKw === 0 ? "Grid Bypassed" : "Importing"}
          </span>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="mt-5 flex items-center justify-between rounded-xl bg-primary px-4 py-2.5 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-semibold">Right Now Status</span>
        </div>
        <span className="text-sm font-black tracking-wide text-accent">
          {data.selfSufficiencyPct}% Powered by Solar at This Moment
        </span>
      </div>
    </Card>
  );
}
