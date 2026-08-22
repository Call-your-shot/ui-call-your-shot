"use client";

import React from "react";
import Card from "@/components/ui/Card";
import { DollarSign, ArrowRight, Shield, Wallet } from "lucide-react";

interface CashflowWaterfallProps {
  tenantSalesDollars?: number;
  exportCreditsDollars?: number;
  reserveDeductionDollars?: number;
  monthLabel?: string;
}

export function CashflowWaterfall({
  tenantSalesDollars = 69,
  exportCreditsDollars = 13,
  reserveDeductionDollars = 18,
  monthLabel = "Aug 2025",
}: CashflowWaterfallProps) {
  const grossRevenue = tenantSalesDollars + exportCreditsDollars;
  const netPayout = grossRevenue - reserveDeductionDollars;

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
              Monthly Financial Breakdown
            </span>
            <h3 className="text-h3 mt-0.5 text-grey-900">Cash Flow Waterfall</h3>
          </div>
          <span className="rounded-lg bg-grey-100 px-2.5 py-1 text-xs font-bold text-grey-700">
            {monthLabel} Statement
          </span>
        </div>

        <p className="text-xs text-grey-600 mt-1">
          How gross solar revenue flows through reserve deductions into your net landlord payout.
        </p>

        {/* Visual Waterfall Flow Blocks */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4 items-center">
          {/* Step 1: Tenant Sales */}
          <div className="flex flex-col rounded-xl border border-primary/20 bg-primary-lighter/40 p-3 text-center">
            <span className="text-[10px] font-semibold text-grey-500 uppercase">Tenant Solar</span>
            <span className="text-lg font-black text-primary-darker">+${tenantSalesDollars}</span>
            <span className="text-[10px] text-primary font-medium">15¢ / kWh PPA</span>
          </div>

          {/* Step 2: Grid Export */}
          <div className="flex flex-col rounded-xl border border-info/20 bg-info-light/40 p-3 text-center">
            <span className="text-[10px] font-semibold text-grey-500 uppercase">Grid Export</span>
            <span className="text-lg font-black text-info-darker">+${exportCreditsDollars}</span>
            <span className="text-[10px] text-info font-medium">4¢ / kWh FiT</span>
          </div>

          {/* Step 3: Reserve Deduction */}
          <div className="flex flex-col rounded-xl border border-warning/30 bg-warning-light/40 p-3 text-center">
            <span className="text-[10px] font-semibold text-grey-500 uppercase">Sinking Reserve</span>
            <span className="text-lg font-black text-warning-darker">-${reserveDeductionDollars}</span>
            <span className="text-[10px] text-warning-dark font-medium">Equipment Fund</span>
          </div>

          {/* Step 4: Net Landlord Payout */}
          <div className="flex flex-col rounded-xl border-2 border-success bg-success-light/60 p-3 text-center ring-2 ring-success/20">
            <span className="text-[10px] font-extrabold text-success uppercase">Net Landlord Payout</span>
            <span className="text-xl font-black text-success-darker">${netPayout}</span>
            <span className="text-[10px] font-bold text-success">Deposited</span>
          </div>
        </div>

        {/* Summary Equation Strip */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-grey-50 px-4 py-2.5 text-xs text-grey-700 font-mono">
          <span>Gross (${grossRevenue}) - Reserve (${reserveDeductionDollars})</span>
          <span className="font-bold text-success text-sm">= Net Payout (${netPayout})</span>
        </div>
      </div>
    </Card>
  );
}
