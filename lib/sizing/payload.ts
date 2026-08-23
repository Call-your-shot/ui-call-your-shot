import type { MonthlyDemandEstimate } from "@/lib/annualLoad/types";
import type { SolarResult } from "@/lib/solar/types";
import type { SolarSizingInput } from "./types";

const MAX_CANDIDATES = 16;

export function candidateSet(result: SolarResult) {
  const ordered = [...result.alternatives].sort((a, b) => a.panelCount - b.panelCount);
  if (ordered.length <= MAX_CANDIDATES) return ordered;
  const indexes = new Set<number>();
  for (let i = 0; i < MAX_CANDIDATES; i += 1) {
    indexes.add(Math.round(i * (ordered.length - 1) / (MAX_CANDIDATES - 1)));
  }
  return [...indexes].map((index) => ordered[index]);
}

export function buildSizingPayload(
  result: SolarResult,
  monthlyDemand: MonthlyDemandEstimate[],
  occupancy: "most" | "sometimes" | "rarely",
  gridRateCentsPerKwh: number,
): SolarSizingInput {
  return {
    monthlyDemand,
    candidates: candidateSet(result).map((candidate) => ({
      candidateId: candidate.candidateId,
      source: result.source,
      panelCount: candidate.panelCount,
      panelWatts: result.system.panelWatts,
      systemSizeKw: candidate.systemSizeKw,
      annualGenerationKwh: candidate.annualKwh,
    })),
    daytimeOccupancy: occupancy,
    pricing: {
      pricingMode: "dynamic",
      gridRateCentsPerKwh,
      exportRateCentsPerKwh: 4,
    },
    simulation: { iterations: 1_000, forecastYears: 25, randomSeed: 42 },
  };
}
