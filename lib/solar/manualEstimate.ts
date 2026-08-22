import type { ScenarioId } from "@/lib/mockData";
import { formatAddress, scenarios } from "@/lib/mockData";
import { compassDirection } from "./normalize";
import type { SolarResult } from "./types";

const PANEL_HEIGHT_M = 1.7;
const PANEL_WIDTH_M = 1.0;
const PANEL_WATTS = 440;
const KWH_PER_KW_PER_YEAR = 1400; // rough Illawarra-region rule of thumb

/**
 * Builds a SolarResult from a user's manually-entered roof area and
 * orientation, for the NO_COVERAGE path — the assessment can continue even
 * when Google has no detailed data for this address.
 */
export function buildManualSolarResult(
  input: { areaM2: number; azimuthDegrees: number; pitchDegrees: number; address: string },
  scenario: ScenarioId
): SolarResult {
  const panelFootprint = PANEL_HEIGHT_M * PANEL_WIDTH_M;
  // Manual estimates can't know real obstructions/setbacks, so only credit
  // ~70% of the entered area as actually panel-able.
  const panelCount = Math.max(0, Math.floor((input.areaM2 * 0.7) / panelFootprint));
  const systemSizeKw = Math.round(((panelCount * PANEL_WATTS) / 1000) * 10) / 10;
  const estimatedAnnualAcKwh = Math.round(systemSizeKw * KWH_PER_KW_PER_YEAR);

  return {
    source: "mock",
    quality: "BASE",
    imageryDate: "Manual estimate",
    imageryAgeYears: 0,
    formattedAddress: input.address || formatAddress(scenarios[scenario].address),
    center: { lat: -34.372, lng: 150.906 },

    roof: {
      totalAreaM2: Math.round(input.areaM2),
      maxUsableAreaM2: Math.round(input.areaM2 * 0.8),
      practicalAreaM2: Math.round(panelCount * panelFootprint),
      segments: [
        {
          index: 0,
          pitchDegrees: input.pitchDegrees,
          azimuthDegrees: input.azimuthDegrees,
          compassDirection: compassDirection(input.azimuthDegrees),
          areaM2: Math.round(input.areaM2),
          annualSunshineHours: 1400,
        },
      ],
    },

    system: {
      panelCount,
      panelWatts: PANEL_WATTS,
      systemSizeKw,
      estimatedAnnualAcKwh,
      panelDimensions: { heightM: PANEL_HEIGHT_M, widthM: PANEL_WIDTH_M },
      segmentBreakdown: [{ segmentIndex: 0, panelsCount: panelCount, annualKwh: estimatedAnnualAcKwh }],
    },

    panels: [],
    alternatives: [],
    carbonOffsetKgPerYear: Math.round(estimatedAnnualAcKwh * 0.7),
  };
}
