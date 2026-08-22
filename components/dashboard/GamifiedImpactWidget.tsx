"use client";

import React from "react";
import Card from "@/components/ui/Card";
import { TreePine, Car, Coins, Award, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface GamifiedImpactProps {
  totalSolarKwh?: number;
  greenCreditBalance?: number;
}

export function GamifiedImpactWidget({
  totalSolarKwh = 1240,
  greenCreditBalance = 250,
}: GamifiedImpactProps) {
  // 1 kWh solar = ~0.7 kg CO2 avoided in Australia (NGA factors)
  const co2AvoidedKg = Math.round(totalSolarKwh * 0.7);
  // 1 tree absorbs ~20kg CO2/year -> co2AvoidedKg / 20
  const treesEquivalent = Math.round(co2AvoidedKg / 20);
  // Average EV gets 6 km / kWh
  const evKmEquivalent = Math.round(totalSolarKwh * 6);

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
              Gamified Impact
            </span>
            <h3 className="text-h3 mt-0.5 text-grey-900">Carbon &amp; Green Credits</h3>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-success-light px-3 py-1 text-xs font-bold text-success">
            <Award size={14} />
            <span>Eco Milestone</span>
          </div>
        </div>

        {/* Big Carbon Avoided Stat */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-primary-lighter/60 via-primary-lighter/30 to-transparent p-3.5 border border-primary-lighter">
          <div>
            <p className="text-[11px] font-semibold text-grey-500 uppercase">Total CO₂ Avoided</p>
            <p className="text-2xl font-black text-primary-darker">{co2AvoidedKg} <span className="text-sm font-bold">kg CO₂</span></p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm">
            <TreePine size={20} />
          </div>
        </div>

        {/* Equivalents Grid */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 rounded-lg border border-grey-200/80 bg-grey-50 p-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-light text-warning-darker">
              <TreePine size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-grey-500">Trees Planted Eq.</p>
              <p className="text-xs font-black text-grey-900">{treesEquivalent} Mature Trees</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg border border-grey-200/80 bg-grey-50 p-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info-light text-info-darker">
              <Car size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-grey-500">Zero-Emission EV</p>
              <p className="text-xs font-black text-grey-900">{evKmEquivalent.toLocaleString()} km Driving</p>
            </div>
          </div>
        </div>
      </div>

      {/* Green Credit Wallet Banner */}
      <div className="mt-4 border-t border-grey-200/60 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={18} className="text-warning-dark" />
            <div>
              <p className="text-xs font-bold text-grey-900">Green Credit Wallet</p>
              <p className="text-[11px] text-grey-500">{greenCreditBalance} Credits Available</p>
            </div>
          </div>

          <Link
            href="/green-credits"
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <span>Allocate</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </Card>
  );
}
