import { describe, expect, it } from "vitest";
import {
  compassDirection,
  formatImageryDate,
  imageryAgeYears,
  medianSunshineHours,
  selectConfig,
  SYSTEM_DERATE,
  TARGET_PANEL_WATTS,
} from "./normalize";
import type { SolarPanelConfig } from "./types";

describe("compassDirection", () => {
  it.each([
    [0, "North"],
    [45, "North-east"],
    [90, "East"],
    [135, "South-east"],
    [180, "South"],
    [225, "South-west"],
    [270, "West"],
    [315, "North-west"],
    [360, "North"],
  ])("buckets %d° as %s", (deg, expected) => {
    expect(compassDirection(deg)).toBe(expected);
  });

  it("rounds to the nearest 8-point bucket rather than truncating", () => {
    // 40° is closer to North-east (45°) than North (0°).
    expect(compassDirection(40)).toBe("North-east");
    // 20° is closer to North (0°) than North-east (45°).
    expect(compassDirection(20)).toBe("North");
  });

  it("handles negative bearings by wrapping into 0-360", () => {
    expect(compassDirection(-45)).toBe("North-west");
  });
});

describe("medianSunshineHours", () => {
  it("returns the middle value for an odd-length array", () => {
    expect(medianSunshineHours([100, 200, 300])).toBe(200);
  });

  it("averages the two middle values for an even-length array", () => {
    expect(medianSunshineHours([100, 200, 300, 400])).toBe(250);
  });

  it("returns 0 for an empty array", () => {
    expect(medianSunshineHours([])).toBe(0);
  });
});

describe("formatImageryDate / imageryAgeYears", () => {
  it("formats a date as 'Month Year'", () => {
    expect(formatImageryDate({ year: 2024, month: 3, day: 15 })).toBe("March 2024");
  });

  it("computes a positive age in years for a past date", () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setUTCFullYear(twoYearsAgo.getUTCFullYear() - 2);
    const age = imageryAgeYears({
      year: twoYearsAgo.getUTCFullYear(),
      month: twoYearsAgo.getUTCMonth() + 1,
      day: 1,
    });
    expect(age).toBeGreaterThan(1.9);
    expect(age).toBeLessThan(2.1);
  });
});

describe("selectConfig", () => {
  const configs: SolarPanelConfig[] = [
    { panelsCount: 6, yearlyEnergyDcKwh: 2000, roofSegmentSummaries: [] },
    { panelsCount: 12, yearlyEnergyDcKwh: 4000, roofSegmentSummaries: [] },
    { panelsCount: 18, yearlyEnergyDcKwh: 6000, roofSegmentSummaries: [] },
    { panelsCount: 24, yearlyEnergyDcKwh: 8000, roofSegmentSummaries: [] },
  ];
  const scale = TARGET_PANEL_WATTS / 250; // Google's common 250W reference panel

  it("picks the config closest to the target, not the largest", () => {
    // AC kWh at scale/derate for each: ~2992 / 5984 / 8976 / 11968 approx —
    // pick a target that clearly sits nearest the 12-panel config.
    const target = 6000;
    const picked = selectConfig(configs, target, scale, SYSTEM_DERATE);
    expect(picked.panelsCount).toBe(12);
  });

  it("does not default to the maximum array when the target is modest", () => {
    const picked = selectConfig(configs, 3000, scale, SYSTEM_DERATE);
    expect(picked.panelsCount).not.toBe(24);
  });

  it("picks the largest config when the target exceeds every option", () => {
    const picked = selectConfig(configs, 999_999, scale, SYSTEM_DERATE);
    expect(picked.panelsCount).toBe(24);
  });

  it("throws on an empty config list rather than silently returning undefined", () => {
    expect(() => selectConfig([], 5000, scale, SYSTEM_DERATE)).toThrow();
  });
});
