import { computePanelCorners, projectLatLngToPixel } from "@/lib/geometry";
import { STATIC_MAP_SIZE, STATIC_MAP_ZOOM } from "./constants";
import type {
  BuildingInsightsResponse,
  SolarAlternative,
  SolarPanelConfig,
  SolarPanelOverlay,
  SolarResult,
  SolarRoofSegment,
  ImageryQuality,
} from "./types";

/** Australian rooftop panels are commonly ~440W; Google's per-panel figures
 * are frequently calculated against a much smaller reference panel (often
 * 250W), so every energy number needs rescaling before it means anything. */
export const TARGET_PANEL_WATTS = 440;

/** DC output at the panel isn't what gets delivered — inverter conversion,
 * wiring resistance, soiling and temperature all take a cut. */
export const SYSTEM_DERATE = 0.85;

const COMPASS_POINTS = [
  "North",
  "North-east",
  "East",
  "South-east",
  "South",
  "South-west",
  "West",
  "North-west",
];

/** Buckets a compass bearing (0-360, clockwise from north) into an 8-point
 * compass label, e.g. 37° -> "North-east". */
export function compassDirection(azimuthDegrees: number): string {
  const normalized = ((azimuthDegrees % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return COMPASS_POINTS[index];
}

/** Google's sunshineQuantiles is an ascending array (commonly deciles, 0th
 * to 100th percentile). We report the median as a representative figure. */
export function medianSunshineHours(sunshineQuantiles: number[]): number {
  if (sunshineQuantiles.length === 0) return 0;
  const mid = Math.floor(sunshineQuantiles.length / 2);
  return sunshineQuantiles.length % 2 === 1
    ? sunshineQuantiles[mid]
    : (sunshineQuantiles[mid - 1] + sunshineQuantiles[mid]) / 2;
}

export function formatImageryDate(date: { year: number; month: number; day: number }): string {
  const d = new Date(Date.UTC(date.year, Math.max(0, date.month - 1), date.day || 1));
  return d.toLocaleDateString("en-AU", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function imageryAgeYears(date: { year: number; month: number; day: number }): number {
  const imageryMs = Date.UTC(date.year, Math.max(0, date.month - 1), date.day || 1);
  const ageMs = Date.now() - imageryMs;
  return ageMs / (1000 * 60 * 60 * 24 * 365.25);
}

/** Selects the panel configuration whose scaled/derated AC output is
 * closest to the household's target annual usage — not the largest array
 * available, since most rental roofs shouldn't be maximised. */
export function selectConfig(
  configs: SolarPanelConfig[],
  targetAnnualKwh: number,
  scale: number,
  derate: number
): SolarPanelConfig {
  if (configs.length === 0) {
    throw new Error("selectConfig: no configs to choose from");
  }
  const acKwh = (c: SolarPanelConfig) => c.yearlyEnergyDcKwh * scale * derate;
  return configs.reduce((best, c) =>
    Math.abs(acKwh(c) - targetAnnualKwh) < Math.abs(acKwh(best) - targetAnnualKwh) ? c : best
  );
}

/** Selects the panel configuration whose system size (panel count x our
 * standard 440W panel — same basis as `alternatives[].systemSizeKw` below)
 * is closest to a target size in kW — used when the sizing backend hands
 * back a recommended system size directly rather than a target annual
 * usage. Panel count itself isn't rescaled (see TARGET_PANEL_WATTS above),
 * only the per-panel energy yield is, so this deliberately doesn't take a
 * `scale` argument. */
export function selectConfigByKw(configs: SolarPanelConfig[], targetSystemSizeKw: number): SolarPanelConfig {
  if (configs.length === 0) {
    throw new Error("selectConfigByKw: no configs to choose from");
  }
  const systemSizeKw = (c: SolarPanelConfig) => (c.panelsCount * TARGET_PANEL_WATTS) / 1000;
  return configs.reduce((best, c) =>
    Math.abs(systemSizeKw(c) - targetSystemSizeKw) < Math.abs(systemSizeKw(best) - targetSystemSizeKw)
      ? c
      : best
  );
}

/**
 * Converts a raw Google Solar API building-insights response, plus the
 * household's target annual usage, into the shape the UI actually renders.
 * Two corrections are applied that are easy to miss: rescaling for
 * Australian (440W) panels, and converting DC panel output to AC delivered
 * energy — see TARGET_PANEL_WATTS / SYSTEM_DERATE above.
 */
export function normalizeBuildingInsights(
  building: BuildingInsightsResponse,
  quality: ImageryQuality,
  formattedAddress: string,
  targetAnnualKwh: number,
  targetSystemSizeKw?: number
): SolarResult {
  const { solarPotential } = building;
  const scale = TARGET_PANEL_WATTS / solarPotential.panelCapacityWatts;

  // A recommended system size (from the sizing backend) takes precedence
  // over matching by annual usage when both are available.
  const selected = targetSystemSizeKw
    ? selectConfigByKw(solarPotential.solarPanelConfigs, targetSystemSizeKw)
    : selectConfig(solarPotential.solarPanelConfigs, targetAnnualKwh, scale, SYSTEM_DERATE);

  const scaledAcKwh = (dcKwh: number) => dcKwh * scale * SYSTEM_DERATE;

  const segments: SolarRoofSegment[] = solarPotential.roofSegmentStats.map((seg, index) => ({
    index,
    pitchDegrees: seg.pitchDegrees,
    azimuthDegrees: seg.azimuthDegrees,
    compassDirection: compassDirection(seg.azimuthDegrees),
    areaM2: Math.round(seg.stats.areaMeters2),
    annualSunshineHours: Math.round(medianSunshineHours(seg.stats.sunshineQuantiles)),
  }));

  const segmentBreakdown = selected.roofSegmentSummaries.map((s) => ({
    segmentIndex: s.segmentIndex,
    panelsCount: s.panelsCount,
    annualKwh: Math.round(scaledAcKwh(s.yearlyEnergyDcKwh)),
  }));

  // Practical usable area, derived from the panels we're actually
  // recommending rather than Google's generous theoretical maximum.
  const practicalAreaM2 =
    selected.panelsCount * solarPotential.panelHeightMeters * solarPotential.panelWidthMeters;

  const mapCenter = { lat: building.center.latitude, lng: building.center.longitude };

  // Only project panels belonging to segments in the SELECTED config, in
  // panel-count order, so the overlay matches what we're recommending.
  const selectedSegmentIndices = new Set(selected.roofSegmentSummaries.map((s) => s.segmentIndex));
  const relevantPanels = solarPotential.solarPanels.filter((p) =>
    selectedSegmentIndices.has(p.segmentIndex)
  );
  const panelsToShow = relevantPanels.slice(0, selected.panelsCount);

  const panels: SolarPanelOverlay[] = panelsToShow.map((panel) => {
    const center = { lat: panel.center.latitude, lng: panel.center.longitude };
    const segment = solarPotential.roofSegmentStats[panel.segmentIndex];
    const corners = computePanelCorners(
      center,
      solarPotential.panelHeightMeters,
      solarPotential.panelWidthMeters,
      panel.orientation,
      segment?.azimuthDegrees ?? 0
    );
    const polygon: Array<[number, number]> = corners.map(([lat, lng]) => {
      const { x, y } = projectLatLngToPixel(
        { lat, lng },
        mapCenter,
        STATIC_MAP_ZOOM,
        STATIC_MAP_SIZE,
        STATIC_MAP_SIZE
      );
      return [x, y];
    });
    return {
      lat: center.lat,
      lng: center.lng,
      orientation: panel.orientation,
      segmentIndex: panel.segmentIndex,
      annualKwh: Math.round(scaledAcKwh(panel.yearlyEnergyDcKwh)),
      polygon,
    };
  });

  const alternatives: SolarAlternative[] = solarPotential.solarPanelConfigs.map((c) => ({
    panelCount: c.panelsCount,
    systemSizeKw: Math.round(((c.panelsCount * TARGET_PANEL_WATTS) / 1000) * 10) / 10,
    annualKwh: Math.round(scaledAcKwh(c.yearlyEnergyDcKwh)),
  }));

  const estimatedAnnualAcKwh = Math.round(scaledAcKwh(selected.yearlyEnergyDcKwh));

  return {
    source: "google",
    quality,
    imageryDate: formatImageryDate(building.imageryDate),
    imageryAgeYears: imageryAgeYears(building.imageryDate),
    formattedAddress,
    center: mapCenter,

    roof: {
      totalAreaM2: Math.round(solarPotential.wholeRoofStats.areaMeters2),
      maxUsableAreaM2: Math.round(solarPotential.maxArrayAreaMeters2),
      practicalAreaM2: Math.round(practicalAreaM2),
      segments,
    },

    system: {
      panelCount: selected.panelsCount,
      panelWatts: TARGET_PANEL_WATTS,
      systemSizeKw: Math.round(((selected.panelsCount * TARGET_PANEL_WATTS) / 1000) * 10) / 10,
      estimatedAnnualAcKwh,
      panelDimensions: {
        heightM: solarPotential.panelHeightMeters,
        widthM: solarPotential.panelWidthMeters,
      },
      segmentBreakdown,
    },

    panels,
    alternatives,
    carbonOffsetKgPerYear: Math.round(
      (estimatedAnnualAcKwh / 1000) * solarPotential.carbonOffsetFactorKgPerMwh
    ),
  };
}
