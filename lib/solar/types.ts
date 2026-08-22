// ---------------------------------------------------------------------------
// Types for the Google Solar API integration.
// ---------------------------------------------------------------------------

export interface LatLng {
  latitude: number;
  longitude: number;
}

export type ImageryQuality = "HIGH" | "MEDIUM" | "BASE";
export type PanelOrientation = "PORTRAIT" | "LANDSCAPE";

// --- Raw Google Solar API response (the slice we actually use) -----------

export interface RoofSegmentStats {
  pitchDegrees: number;
  azimuthDegrees: number;
  center: LatLng;
  boundingBox: { sw: LatLng; ne: LatLng };
  stats: { areaMeters2: number; groundAreaMeters2: number; sunshineQuantiles: number[] };
}

export interface RoofSegmentSummary {
  pitchDegrees: number;
  azimuthDegrees: number;
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  segmentIndex: number;
}

export interface SolarPanelConfig {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  roofSegmentSummaries: RoofSegmentSummary[];
}

export interface SolarPanel {
  center: LatLng;
  orientation: PanelOrientation;
  yearlyEnergyDcKwh: number;
  segmentIndex: number;
}

export interface SolarPotential {
  maxArrayPanelsCount: number;
  maxArrayAreaMeters2: number;
  maxSunshineHoursPerYear: number;
  panelCapacityWatts: number;
  panelHeightMeters: number;
  panelWidthMeters: number;
  panelLifetimeYears: number;
  carbonOffsetFactorKgPerMwh: number;
  wholeRoofStats: { areaMeters2: number; groundAreaMeters2: number; sunshineQuantiles: number[] };
  roofSegmentStats: RoofSegmentStats[];
  solarPanelConfigs: SolarPanelConfig[];
  solarPanels: SolarPanel[];
}

export interface BuildingInsightsResponse {
  name: string;
  center: LatLng;
  boundingBox: { sw: LatLng; ne: LatLng };
  imageryDate: { year: number; month: number; day: number };
  imageryQuality: ImageryQuality;
  postalCode?: string;
  administrativeArea?: string;
  regionCode?: string;
  solarPotential: SolarPotential;
}

// --- Normalised shape the UI actually consumes ----------------------------

export interface SolarRoofSegment {
  index: number;
  pitchDegrees: number;
  azimuthDegrees: number;
  compassDirection: string;
  areaM2: number;
  annualSunshineHours: number;
}

export interface SolarPanelOverlay {
  lat: number;
  lng: number;
  orientation: PanelOrientation;
  segmentIndex: number;
  annualKwh: number;
  polygon: Array<[number, number]>;
}

export interface SolarAlternative {
  panelCount: number;
  systemSizeKw: number;
  annualKwh: number;
}

export interface SolarResult {
  source: "google" | "mock";
  quality: ImageryQuality;
  imageryDate: string;
  imageryAgeYears: number;
  formattedAddress: string;
  center: { lat: number; lng: number };

  roof: {
    totalAreaM2: number;
    /** Google's generous theoretical maximum — label as such in the UI. */
    maxUsableAreaM2: number;
    /** Derived from the selected panel count × panel dimensions. */
    practicalAreaM2: number;
    segments: SolarRoofSegment[];
  };

  system: {
    panelCount: number;
    panelWatts: number;
    systemSizeKw: number;
    estimatedAnnualAcKwh: number;
    panelDimensions: { heightM: number; widthM: number };
    segmentBreakdown: Array<{ segmentIndex: number; panelsCount: number; annualKwh: number }>;
  };

  panels: SolarPanelOverlay[];
  alternatives: SolarAlternative[];
  carbonOffsetKgPerYear: number;
}

// --- Route handler error / envelope shapes --------------------------------

export type SolarErrorCode = "GEOCODE_FAILED" | "NO_COVERAGE" | "API_ERROR";

export interface SolarApiError {
  ok: false;
  code: SolarErrorCode;
  message: string;
  /** Present when we fell back to mock data rather than dead-ending. */
  fallback?: SolarResult;
}

export interface SolarApiSuccess {
  ok: true;
  result: SolarResult;
}

export type SolarApiResponse = SolarApiSuccess | SolarApiError;
