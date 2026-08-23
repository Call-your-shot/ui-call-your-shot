import { describe, expect, it } from "vitest";
import { buildMockSolarResult } from "@/lib/solar/mockFallback";
import { applySolarAlternative } from "@/lib/solar/normalize";
import { buildSizingPayload, candidateSet } from "./payload";

describe("solar sizing payload", () => {
  it("sends physical candidates and all twelve demand months", () => {
    const result = buildMockSolarResult("bellambi");
    const monthlyDemand = Array.from({ length: 12 }, (_, index) => ({
      calendarMonth: index + 1,
      monthName: new Date(2025, index, 1).toLocaleString("en-AU", { month: "long" }),
      usageKwh: 400,
      daytimeUsageRatio: 0.4,
      source: "survey_derived" as const,
    }));

    const payload = buildSizingPayload(result, monthlyDemand, "sometimes", 33);

    expect(payload.monthlyDemand).toHaveLength(12);
    expect(payload.candidates.length).toBeGreaterThan(1);
    expect(payload.candidates.at(-1)?.panelCount).toBe(result.system.panelCount);
    expect(payload.candidates.every((candidate) => candidate.source === "mock")).toBe(true);
  });

  it("caps large Google candidate sets while retaining both endpoints", () => {
    const result = buildMockSolarResult("bellambi");
    result.alternatives = Array.from({ length: 80 }, (_, index) => ({
      candidateId: `google-${index + 1}`,
      panelCount: index + 1,
      systemSizeKw: (index + 1) * 0.44,
      annualKwh: (index + 1) * 600,
    }));

    const candidates = candidateSet(result);

    expect(candidates).toHaveLength(16);
    expect(candidates[0].panelCount).toBe(1);
    expect(candidates.at(-1)?.panelCount).toBe(80);
  });

  it("applies the recommended count without changing the physical roof limit", () => {
    const result = buildMockSolarResult("bellambi");
    const smaller = result.alternatives.find((candidate) => candidate.panelCount < result.system.panelCount)!;

    const selected = applySolarAlternative(result, smaller);

    expect(selected.system.panelCount).toBe(smaller.panelCount);
    expect(selected.system.estimatedAnnualAcKwh).toBe(smaller.annualKwh);
    expect(selected.roof.maxUsableAreaM2).toBe(result.roof.maxUsableAreaM2);
    expect(selected.roof.practicalAreaM2).toBeLessThan(result.roof.practicalAreaM2);
  });
});
