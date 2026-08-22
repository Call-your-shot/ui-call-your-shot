"use client";

import React from "react";
import Card from "@/components/ui/Card";
import { PiggyBank, ShieldCheck, Calendar } from "lucide-react";

interface SinkingFundProps {
  accruedDollars?: number;
  targetEstimateDollars?: number;
  nextCostDescription?: string;
  nextCostDate?: string;
}

export function SinkingFundProgressBar({
  accruedDollars = 486,
  targetEstimateDollars = 1500,
  nextCostDescription = "Inverter Replacement",
  nextCostDate = "1 Feb 2035",
}: SinkingFundProps) {
  const percentFunded = Math.min(100, Math.round((accruedDollars / targetEstimateDollars) * 100));

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
              Equipment Sinking Fund
            </span>
            <h3 className="text-h3 mt-0.5 text-grey-900">Maintenance Reserve</h3>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-info-light px-3 py-1 text-xs font-bold text-info-darker">
            <PiggyBank size={14} />
            <span>Self-Funding Asset</span>
          </div>
        </div>

        <p className="text-xs text-grey-600 mt-1">
          $18/mo is automatically set aside from tenant PPA payments so future equipment replacements cost $0 out of pocket.
        </p>

        {/* Big Balance & Target */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-grey-50 p-3.5 border border-grey-200/80">
          <div>
            <span className="text-[10px] font-semibold text-grey-500 uppercase">Accrued Sinking Balance</span>
            <p className="text-2xl font-black text-grey-900">${accruedDollars} <span className="text-xs font-bold text-grey-500">/ ${targetEstimateDollars} Target</span></p>
          </div>
          <span className="rounded-lg bg-info/10 px-2.5 py-1 text-sm font-black text-info">
            {percentFunded}% Funded
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-grey-600">
            <span>Progress towards {nextCostDescription}</span>
            <span>Est. {nextCostDate}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-grey-200">
            <div
              className="h-full rounded-full bg-info transition-all duration-700"
              style={{ width: `${percentFunded}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-success font-semibold">
          <ShieldCheck size={14} />
          <span>Zero future out-of-pocket capital required for repairs</span>
        </div>
      </div>
    </Card>
  );
}
