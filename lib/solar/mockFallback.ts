import { formatAddress, scenarios, type ScenarioId } from "@/lib/mockData";
import type { SolarResult } from "./types";

/**
 * Builds a SolarResult-shaped object from the existing mock scenario data,
 * so the UI never has to know whether it's looking at a real API response
 * or the fallback — same shape either way, `source` is the only tell.
 *
 * No panel geo-coordinates exist in the mock data, so `panels` is empty —
 * the roof screen falls back to its original abstract grid visualisation
 * whenever it sees that, which is exactly the pre-integration UI.
 */
export function buildMockSolarResult(scenarioId: ScenarioId): SolarResult {
  const scenario = scenarios[scenarioId];
  const { roof } = scenario;
  const panelDimensions = { heightM: 1.7, widthM: 1.0 };
  const practicalAreaM2 = roof.panelCount * panelDimensions.heightM * panelDimensions.widthM;

  return {
    source: "mock",
    quality: "HIGH",
    imageryDate: "Demonstration data",
    imageryAgeYears: 0,
    formattedAddress: formatAddress(scenario.address),
    center: { lat: -34.372, lng: 150.906 }, // approx Bellambi, NSW

    roof: {
      totalAreaM2: Math.round(practicalAreaM2 * 1.6),
      maxUsableAreaM2: Math.round(practicalAreaM2 * 1.3),
      practicalAreaM2: Math.round(practicalAreaM2),
      segments: [
        {
          index: 0,
          pitchDegrees: roof.pitchDegrees,
          azimuthDegrees: roof.orientation.startsWith("North") ? 0 : 180,
          compassDirection: roof.orientation.replace("-facing", ""),
          areaM2: Math.round(practicalAreaM2),
          annualSunshineHours: scenario.works ? 1650 : 950,
        },
      ],
    },

    system: {
      panelCount: roof.panelCount,
      panelWatts: 440,
      systemSizeKw: roof.systemSizeKw,
      estimatedAnnualAcKwh: Math.round(roof.systemSizeKw * 1400),
      panelDimensions,
      segmentBreakdown: [
        {
          segmentIndex: 0,
          panelsCount: roof.panelCount,
          annualKwh: Math.round(roof.systemSizeKw * 1400),
        },
      ],
    },

    panels: [],
    alternatives: Array.from({ length: roof.panelCount }, (_, index) => index + 1)
      .filter((count) => count === 1 || count === roof.panelCount || count % 2 === 0)
      .map((count) => ({
        candidateId: `mock-${count}`,
        panelCount: count,
        systemSizeKw: Math.round(count * 440 / 100) / 10,
        annualKwh: Math.round(count * 440 / 1000 * 1400),
      })),
    carbonOffsetKgPerYear: Math.round(roof.systemSizeKw * 1400 * 0.7),
  };
}
