"use client";

import BottomCTA from "@/components/ui/BottomCTA";
import Button from "@/components/ui/Button";
import Callout from "@/components/ui/Callout";
import StatChip from "@/components/ui/StatChip";
import HouseIllustration from "@/components/civic/HouseIllustration";
import { loadBillFlow } from "@/lib/billFlow";
import { useDemo } from "@/lib/demo-context";
import { fetchSolarData } from "@/lib/solar/client";
import { buildManualSolarResult } from "@/lib/solar/manualEstimate";
import { buildMockSolarResult } from "@/lib/solar/mockFallback";
import type { SolarApiResponse, SolarResult } from "@/lib/solar/types";
import { applySolarAlternative } from "@/lib/solar/normalize";
import { billFlowToPayload } from "@/lib/annualLoad/payload";
import type { MonthlyDemandEstimate } from "@/lib/annualLoad/types";
import type { InitialAssessment, InitialAssessmentInput } from "@/lib/backend/types";
import { buildSizingPayload } from "@/lib/sizing/payload";
import type { SolarSizingResult } from "@/lib/sizing/types";
import { ChevronDown, Grid2x2, Compass, Layers, Loader2, MapPin, Satellite } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const findSteps = [
  "Finding your building…",
  "Measuring roof faces…",
  "Checking shading…",
  "Fitting panels…",
];

const STEP_INTERVAL_MS = 1500;
const FINAL_DELAY_MS = 1500;
const HOUSE_COUNT = 6;
// Never let the demo hang indefinitely on a slow real API call.
const SAFETY_TIMEOUT_MS = 10_000;

const ORIENTATIONS: { label: string; azimuth: number }[] = [
  { label: "North", azimuth: 0 },
  { label: "North-east", azimuth: 45 },
  { label: "East", azimuth: 90 },
  { label: "South-east", azimuth: 135 },
  { label: "South", azimuth: 180 },
  { label: "South-west", azimuth: 225 },
  { label: "West", azimuth: 270 },
  { label: "North-west", azimuth: 315 },
];

type ApiPhase =
  | { kind: "address" }
  | { kind: "pending" }
  | { kind: "result"; result: SolarResult }
  | { kind: "geocode_failed"; message: string }
  | { kind: "no_coverage"; message: string };

export default function RoofPage() {
  const router = useRouter();
  const { scenario } = useDemo();

  const [loadingStep, setLoadingStep] = useState(0);
  const [minTimerDone, setMinTimerDone] = useState(false);
  const [outlineDrawn, setOutlineDrawn] = useState(false);
  const [panelsShown, setPanelsShown] = useState(0);
  const [noteOpen, setNoteOpen] = useState(false);

  const [houseTick, setHouseTick] = useState(0);
  const [houseStart, setHouseStart] = useState(0);

  const [apiPhase, setApiPhase] = useState<ApiPhase>({ kind: "address" });
  // Loading ends only once BOTH the sequence's own minimum pacing has
  // elapsed AND real (or fallback) data has actually arrived — derived
  // directly rather than mirrored into its own state + effect.
  const loading = apiPhase.kind === "pending" || (apiPhase.kind === "result" && !minTimerDone);
  const [addressInput, setAddressInput] = useState("");
  const [addressError, setAddressError] = useState("");
  const [targetAnnualKwh, setTargetAnnualKwh] = useState<number | undefined>(undefined);
  const [estimatedAnnualBillDollars, setEstimatedAnnualBillDollars] = useState<number | undefined>(undefined);
  const [ratePerKwhCents, setRatePerKwhCents] = useState<number | undefined>(undefined);
  const [manualArea, setManualArea] = useState("");
  const [manualAzimuth, setManualAzimuth] = useState(0);
  const [manualPitch, setManualPitch] = useState("20");
  const [assessing, setAssessing] = useState(false);
  const [assessmentError, setAssessmentError] = useState("");
  const [sizing, setSizing] = useState<SolarSizingResult | null>(null);
  const [sizingError, setSizingError] = useState("");

  function fallbackMonthlyDemand(annualKwh: number): MonthlyDemandEstimate[] {
    const weights = [0.09, 0.08, 0.075, 0.07, 0.075, 0.09, 0.10, 0.095, 0.075, 0.07, 0.08, 0.10];
    return weights.map((weight, index) => ({
      calendarMonth: index + 1,
      monthName: new Date(2025, index, 1).toLocaleString("en-AU", { month: "long" }),
      usageKwh: annualKwh * weight,
      daytimeUsageRatio: 0.4,
      source: "survey_derived",
    }));
  }

  function resetLookupAnimation() {
    setLoadingStep(0);
    setMinTimerDone(false);
    setOutlineDrawn(false);
    setPanelsShown(0);
    setNoteOpen(false);
    setSizing(null);
    setSizingError("");
    setAssessmentError("");
  }

  async function startRoofLookup() {
    const rawAddress = addressInput.trim();
    if (!rawAddress) {
      setAddressError("Enter the rental property address first.");
      return;
    }

    resetLookupAnimation();
    setAddressError("");
    setApiPhase({ kind: "pending" });

    try {
      const addressResponse = await fetch("/api/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: rawAddress }),
      });
      const addressPayload = (await addressResponse.json()) as { ok: boolean; formattedAddress?: string; message?: string };
      if (!addressResponse.ok || !addressPayload.ok) {
        setApiPhase({
          kind: "geocode_failed",
          message: addressPayload.message ?? "We couldn't find that address. Check it and try again.",
        });
        return;
      }

      const flow = loadBillFlow();
      const address = addressPayload.formattedAddress ?? rawAddress;
      const annualKwh = flow.estimatedAnnualKwh ?? undefined;
      const fullFormData = { ...billFlowToPayload(flow), address };
      setAddressInput(address);
      setTargetAnnualKwh(annualKwh);
      setEstimatedAnnualBillDollars(flow.estimatedAnnualBillDollars ?? undefined);
      setRatePerKwhCents(flow.ratePerKwhCents ?? undefined);

      const params = new URLSearchParams(window.location.search);
      const forceMock = params.get("mock") === "1";
      const response = await fetchSolarData({
        address,
        scenario,
        targetAnnualKwh: annualKwh,
        formData: fullFormData,
        forceMock,
      });
      await sizeAndApply(response);
    } catch (cause) {
      setApiPhase({
        kind: "geocode_failed",
        message: cause instanceof Error ? cause.message : "We couldn't check that address. Try again.",
      });
    }
  }

  async function sizeAndApply(res: SolarApiResponse) {
    if (!res.ok && res.code !== "API_ERROR") {
      applyResponse(res);
      return;
    }
    const rawResult = res.ok ? res.result : res.fallback ?? buildMockSolarResult(scenario);
    const flow = loadBillFlow();
    const annualUsage = flow.estimatedAnnualKwh ?? targetAnnualKwh ?? 5_000;
    const monthlyDemand = flow.monthlyUsage.length === 12
      ? flow.monthlyUsage
      : fallbackMonthlyDemand(annualUsage);
    setSizingError("");
    try {
      const response = await fetch("/api/solar-sizing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSizingPayload(
          rawResult,
          monthlyDemand,
          flow.homeDuringDay ?? "sometimes",
          flow.ratePerKwhCents ?? 35.69,
        )),
      });
      const recommendation = await response.json() as SolarSizingResult & { message?: string };
      if (!response.ok) throw new Error(recommendation.message ?? "Could not optimise panel count");
      const candidate = rawResult.alternatives.find(
        (option) => option.candidateId === recommendation.recommendedCandidateId,
      );
      setSizing(recommendation);
      setApiPhase({ kind: "result", result: candidate ? applySolarAlternative(rawResult, candidate) : rawResult });
    } catch (cause) {
      setSizingError(cause instanceof Error ? cause.message : "Could not optimise panel count");
      setApiPhase({ kind: "result", result: rawResult });
    }
  }

  function applyResponse(res: SolarApiResponse) {
    if (res.ok) {
      setApiPhase({ kind: "result", result: res.result });
    } else if (res.code === "GEOCODE_FAILED") {
      setApiPhase({ kind: "geocode_failed", message: res.message });
    } else if (res.code === "NO_COVERAGE") {
      setApiPhase({ kind: "no_coverage", message: res.message });
    } else {
      // API_ERROR always carries a mock fallback — never dead-end.
      setApiPhase({ kind: "result", result: res.fallback ?? buildMockSolarResult(scenario) });
    }
  }

  useEffect(() => {
    const flow = loadBillFlow();
    const address = flow.address || "";
    const annualKwh = flow.estimatedAnnualKwh ?? undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from sessionStorage after mount
    setAddressInput(address);
    setTargetAnnualKwh(annualKwh);
    setEstimatedAnnualBillDollars(flow.estimatedAnnualBillDollars ?? undefined);
    setRatePerKwhCents(flow.ratePerKwhCents ?? undefined);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (apiPhase.kind === "pending") {
        void sizeAndApply({ ok: true, result: buildMockSolarResult(scenario) });
      }
    }, SAFETY_TIMEOUT_MS);
    return () => clearTimeout(t);
    // The safety timer is intentionally tied only to the request lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, apiPhase.kind]);

  function retryGeocode() {
    void startRoofLookup();
  }

  function submitManualEstimate() {
    const areaNum = parseFloat(manualArea);
    if (!areaNum || areaNum <= 0) return;
    const result = buildManualSolarResult(
      {
        areaM2: areaNum,
        azimuthDegrees: manualAzimuth,
        pitchDegrees: parseFloat(manualPitch) || 20,
        address: addressInput,
      },
      scenario
    );
    setApiPhase({ kind: "pending" });
    void sizeAndApply({ ok: true, result });
  }

  async function createAssessment() {
    if (!result) return;
    const flow = loadBillFlow();
    const payload: InitialAssessmentInput = {
      address: {
        formattedAddress: result.formattedAddress,
        latitude: result.center.lat,
        longitude: result.center.lng,
      },
      system: {
        source: result.source,
        imageryQuality: result.quality,
        imageryDate: result.imageryDate,
        panelCount: result.system.panelCount,
        panelWatts: result.system.panelWatts,
        systemSizeKw: result.system.systemSizeKw,
        expectedAnnualGenerationKwh: result.system.estimatedAnnualAcKwh,
        roofAreaM2: result.roof.totalAreaM2,
        usableRoofAreaM2: result.roof.practicalAreaM2,
      },
      household: {
        expectedAnnualUsageKwh: flow.estimatedAnnualKwh ?? targetAnnualKwh ?? 5000,
        currentAnnualBillDollars: flow.estimatedAnnualBillDollars ?? undefined,
        gridRateCentsPerKwh: flow.ratePerKwhCents ?? undefined,
        daytimeOccupancy: flow.homeDuringDay ?? "sometimes",
        monthlyUsageKwh: flow.monthlyUsage.length === 12
          ? flow.monthlyUsage.sort((a, b) => a.calendarMonth - b.calendarMonth).map((item) => item.usageKwh)
          : undefined,
      },
      pricing: { pricingMode: "dynamic" },
      sizing: sizing?.recommendedCandidateId ? {
        recommendedCandidateId: sizing.recommendedCandidateId,
        recommendedPanelCount: sizing.recommendedPanelCount ?? result.system.panelCount,
        roofMaximumPanelCount: sizing.roofMaximumPanelCount,
        selectionMethod: sizing.selectionMethod,
        recommendationReason: sizing.recommendationReason,
      } : undefined,
    };

    setAssessing(true);
    setAssessmentError("");
    try {
      const response = await fetch("/api/assessments/initial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const assessment = (await response.json()) as InitialAssessment & { message?: string };
      if (!response.ok) throw new Error(assessment.message ?? "Could not calculate ROI");
      window.sessionStorage.setItem("sunshare-latest-assessment-id", assessment.id);
      router.push(`/results?assessmentId=${encodeURIComponent(assessment.id)}`);
    } catch (cause) {
      setAssessmentError(cause instanceof Error ? cause.message : "Could not calculate ROI");
    } finally {
      setAssessing(false);
    }
  }

  // Pick a random starting house client-side only, after the first paint,
  // so the server-rendered and hydrated markup match (avoids a mismatch).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHouseStart(Math.floor(Math.random() * HOUSE_COUNT));
  }, []);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => setHouseTick((t) => t + 1), 1800);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!loading) return;
    if (loadingStep >= findSteps.length - 1) {
      const t = setTimeout(() => setMinTimerDone(true), FINAL_DELAY_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLoadingStep((s) => s + 1), STEP_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [loading, loadingStep]);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setOutlineDrawn(true), 150);
    return () => clearTimeout(t);
  }, [loading]);

  const result = apiPhase.kind === "result" ? apiPhase.result : null;

  useEffect(() => {
    if (loading || !result) return;
    const total = result.system.panelCount;
    if (panelsShown >= total) return;
    const t = setTimeout(() => setPanelsShown((p) => p + 1), 60);
    return () => clearTimeout(t);
  }, [loading, result, panelsShown]);

  const cols = 6;
  const rows = result ? Math.ceil(result.system.panelCount / cols) : 0;
  const houseVariant = (houseStart + houseTick) % HOUSE_COUNT;

  const primarySegment = result
    ? result.roof.segments.reduce(
        (best, s) => (s.areaM2 > best.areaM2 ? s : best),
        result.roof.segments[0]
      )
    : undefined;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex w-full flex-1 flex-col pb-8">
        <h1 className="text-h1 mt-4 text-ink">Your roof</h1>

        {apiPhase.kind === "address" ? (
          <AddressEntryView
            address={addressInput}
            error={addressError}
            onAddressChange={(value) => {
              setAddressInput(value);
              if (addressError) setAddressError("");
            }}
            onSubmit={startRoofLookup}
          />
        ) : loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 pt-6">
            <div
              key={houseVariant}
              className="animate-cross-fade w-full max-w-sm overflow-hidden rounded-lg border border-line"
            >
              <div className="aspect-video w-full">
                <HouseIllustration variant={houseVariant} className="h-full w-full" />
              </div>
            </div>

            <div className="w-full max-w-sm" role="status" aria-live="polite">
              <div className="flex flex-col items-center gap-2">
                {findSteps.map((step, i) => (
                  <p
                    key={step}
                    className={
                      i === loadingStep
                        ? "text-[15px] font-semibold text-ink"
                        : i < loadingStep
                          ? "text-small text-success"
                          : "text-small text-muted"
                    }
                  >
                    {step}
                  </p>
                ))}
              </div>

              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div className="h-full w-1/3 rounded-full bg-accent animate-indeterminate" />
              </div>

              <p className="text-small mt-3 text-center text-muted">
                Homes across the Illawarra already generating their own power.
              </p>
            </div>
          </div>
        ) : apiPhase.kind === "geocode_failed" ? (
          <GeocodeFailedView
            message={apiPhase.message}
            address={addressInput}
            onAddressChange={setAddressInput}
            onRetry={retryGeocode}
          />
        ) : apiPhase.kind === "no_coverage" ? (
          <NoCoverageView
            message={apiPhase.message}
            area={manualArea}
            onAreaChange={setManualArea}
            azimuth={manualAzimuth}
            onAzimuthChange={setManualAzimuth}
            pitch={manualPitch}
            onPitchChange={setManualPitch}
            onSubmit={submitManualEstimate}
          />
        ) : result && primarySegment ? (
          <div className="animate-fade-up pt-4">
            <p className="text-body text-muted">
              {primarySegment.compassDirection}-facing roof
              {result.roof.segments.length > 1 ? ", multiple faces used" : ""}
            </p>
            {targetAnnualKwh && (
              <p className="text-small mt-1 text-muted">
                Sized for ~{targetAnnualKwh.toLocaleString()} kWh/year, estimated from your household
                profile.
                {estimatedAnnualBillDollars != null && ratePerKwhCents != null && (
                  <>
                    {" "}
                    That&apos;s roughly{" "}
                    <span className="font-semibold text-ink">
                      ${estimatedAnnualBillDollars.toLocaleString(undefined, { maximumFractionDigits: 0 })}/year
                    </span>{" "}
                    at {ratePerKwhCents}c/kWh.
                  </>
                )}
              </p>
            )}

            <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-lg border-2 border-primary bg-gradient-to-br from-primary-dark via-primary to-primary-dark">
              {result.source === "google" && result.panels.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/solar-image?lat=${result.center.lat}&lng=${result.center.lng}`}
                    alt="Satellite view of the property"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <svg viewBox="0 0 640 640" className="absolute inset-0 h-full w-full">
                    {result.panels.map((panel, i) => (
                      <polygon
                        key={i}
                        points={panel.polygon.map(([x, y]) => `${x},${y}`).join(" ")}
                        fill="#00A76F"
                        stroke="#004B50"
                        strokeWidth={1}
                        style={{
                          fillOpacity: i < panelsShown ? 0.8 : 0,
                          transition: "fill-opacity 300ms ease-out",
                        }}
                      />
                    ))}
                  </svg>
                </>
              ) : (
                <>
                  {/* Mock aerial texture */}
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.06) 0%, transparent 45%)",
                    }}
                  />
                  <div className="absolute inset-6 rounded-lg bg-primary-dark/30" />

                  <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
                    <polygon
                      points="30,170 30,50 100,20 170,50 170,170"
                      fill="rgba(255,255,255,0.08)"
                      stroke="#00A76F"
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: 600,
                        strokeDashoffset: outlineDrawn ? 0 : 600,
                        transition: "stroke-dashoffset 1s ease-out",
                      }}
                    />
                  </svg>

                  <div className="absolute inset-0 flex items-center justify-center pt-4">
                    <div
                      className="grid gap-1"
                      style={{
                        gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
                        width: "62%",
                      }}
                    >
                      {Array.from({ length: rows * cols }).map((_, i) => {
                        const visible = i < panelsShown && i < result.system.panelCount;
                        return (
                          <div
                            key={i}
                            className="aspect-[3/2] rounded-[2px] border border-primary-dark/40 bg-primary transition-all duration-300"
                            style={{
                              opacity: visible ? 0.85 : 0,
                              transform: visible ? "scale(1)" : "scale(0.6)",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="absolute top-3 left-3 rounded bg-primary-dark/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                {result.source === "google" ? `Satellite imagery — ${result.imageryDate}` : "Simulated aerial view"}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <StatChip
                icon={<Grid2x2 size={14} aria-hidden="true" />}
                label={`${result.system.panelCount} panels`}
                tone="accent"
              />
              <StatChip
                icon={<Layers size={14} aria-hidden="true" />}
                label={`${result.system.systemSizeKw} kW system`}
                tone="secondary"
              />
              <StatChip
                icon={<Compass size={14} aria-hidden="true" />}
                label={`${primarySegment.compassDirection}, ${primarySegment.pitchDegrees}°`}
                tone="primary"
              />
            </div>

            {sizing && (
              <div className="mt-4 rounded-lg border border-primary-light bg-secondary-light p-4">
                <p className="text-[14px] font-semibold text-primary-dark">Demand-matched recommendation</p>
                <p className="text-small mt-1 text-ink">{sizing.recommendationReason}</p>
                <p className="text-small mt-2 text-muted">
                  Your roof can physically fit up to {sizing.roofMaximumPanelCount} panels. We recommend {sizing.recommendedPanelCount} after testing monthly demand, exports, tenant savings and payback.
                </p>
              </div>
            )}

            {sizingError && (
              <div className="mt-3">
                <Callout variant="warning">
                  Panel optimisation is unavailable: {sizingError}. The displayed system is the annual-usage fallback.
                  <Button
                    variant="secondary"
                    className="mt-3"
                    onClick={() => {
                      setApiPhase({ kind: "pending" });
                      void sizeAndApply({ ok: true, result });
                    }}
                  >
                    Retry panel optimisation
                  </Button>
                </Callout>
              </div>
            )}

            {result.source === "mock" && (
              <span className="mt-3 inline-flex items-center rounded-full bg-grey-200 px-3 py-1 text-[12px] font-semibold text-grey-600">
                Demonstration data
              </span>
            )}

            {result.source === "google" && (result.quality === "MEDIUM" || result.quality === "BASE") && (
              <div className="mt-3">
                <Callout variant="warning">
                  Based on {result.quality === "MEDIUM" ? "medium" : "lower"}-resolution imagery
                  — treat these figures as indicative.
                </Callout>
              </div>
            )}

            {result.source === "google" && result.imageryAgeYears > 3 && (
              <div className="mt-3">
                <Callout variant="info">
                  Imagery from {result.imageryDate} — the roof may have changed since.
                </Callout>
              </div>
            )}

            <button
              type="button"
              onClick={() => setNoteOpen((o) => !o)}
              aria-expanded={noteOpen}
              className="mt-5 flex w-full items-center justify-between rounded-lg border border-line bg-surface px-4 py-3.5 text-left hover:bg-surface-alt"
            >
              <span className="text-[14px] font-semibold text-primary">
                How we calculated this
              </span>
              <ChevronDown
                size={16}
                className={`text-primary transition-transform ${noteOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {noteOpen && (
              <div className="mt-2 animate-fade-up">
                <Callout variant="info">
                  {result.source === "google" ? (
                    <>
                      We modelled your roof from Google Solar API building
                      insights ({result.quality.toLowerCase()}-resolution
                      imagery from {result.imageryDate}) and checked shading
                      across the year. Maximum theoretical roof area is{" "}
                      {result.roof.maxUsableAreaM2} m² — we recommend a more
                      conservative {result.roof.practicalAreaM2} m² of actual
                      panels, {result.system.panelCount} in total on the{" "}
                      {primarySegment.compassDirection.toLowerCase()} face.
                    </>
                  ) : (
                    <>
                      We modelled your roof geometry from LiDAR elevation data
                      and checked shading throughout the day, including from
                      the Illawarra escarpment to the west. Panel layout
                      maximises usable area on the{" "}
                      {primarySegment.compassDirection.toLowerCase()} face
                      while keeping clearances from ridge lines and vents.
                    </>
                  )}
                </Callout>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {!loading && result && (
        <BottomCTA>
          {assessmentError && <p className="mb-2 text-small text-error" role="alert">{assessmentError}</p>}
          <Button fullWidth onClick={createAssessment} disabled={assessing || !!sizingError}>
            {assessing ? <><Loader2 size={16} className="animate-spin" /> Calculating ROI…</> : "See your numbers"}
          </Button>
        </BottomCTA>
      )}
    </div>
  );
}

function AddressEntryView({
  address,
  error,
  onAddressChange,
  onSubmit,
}: {
  address: string;
  error: string;
  onAddressChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="animate-fade-up flex flex-1 flex-col justify-center pt-6">
      <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-light text-secondary">
          <Satellite size={24} aria-hidden="true" />
        </span>
        <h2 className="text-h2 mt-4 text-ink">Enter the rental address</h2>
        <p className="text-body mt-2 text-muted">
          We use the address to find satellite roof data, estimate usable panel space, and check whether solar could work for the property.
        </p>

        <label htmlFor="property-address" className="mt-5 block">
          <span className="mb-1.5 block text-[14px] font-semibold text-ink">Property address</span>
          <input
            id="property-address"
            type="text"
            value={address}
            onChange={(event) => onAddressChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSubmit();
            }}
            placeholder="e.g. 12 Corrimal Street, Wollongong NSW 2500"
            className="w-full rounded-lg border border-line bg-surface-alt px-3.5 py-3 text-[15px] text-ink outline-none focus:border-primary focus:bg-surface"
            autoComplete="street-address"
          />
        </label>

        {error && <p className="text-small mt-2 text-error" role="alert">{error}</p>}

        <Button fullWidth className="mt-4" disabled={!address.trim()} onClick={onSubmit}>
          <Satellite size={16} aria-hidden="true" />
          Check satellite roof data
        </Button>

        <p className="text-small mt-3 text-muted">
          You do not need to own the property. The landlord proposal comes later if the roof looks viable.
        </p>
      </div>
    </div>
  );
}

function GeocodeFailedView({
  message,
  address,
  onAddressChange,
  onRetry,
}: {
  message: string;
  address: string;
  onAddressChange: (v: string) => void;
  onRetry: () => void;
}) {
  return (
    <div className="animate-fade-up flex flex-1 flex-col items-center justify-center gap-4 pt-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-warning-light text-warning">
        <MapPin size={26} aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-h3 text-ink">We couldn&apos;t find that address</h2>
        <p className="text-body mt-1 text-muted">{message}</p>
      </div>
      <div className="w-full max-w-sm text-left">
        <label htmlFor="address-retry" className="mb-1.5 block text-[14px] font-semibold text-ink">
          Property address
        </label>
        <input
          id="address-retry"
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          className="w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none focus:border-primary"
        />
        <Button fullWidth className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

function NoCoverageView({
  message,
  area,
  onAreaChange,
  azimuth,
  onAzimuthChange,
  pitch,
  onPitchChange,
  onSubmit,
}: {
  message: string;
  area: string;
  onAreaChange: (v: string) => void;
  azimuth: number;
  onAzimuthChange: (v: number) => void;
  pitch: string;
  onPitchChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const areaValid = parseFloat(area) > 0;
  return (
    <div className="animate-fade-up pt-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunken text-muted">
          <Compass size={26} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-h3 text-ink">Detailed roof data isn&apos;t available yet</h2>
          <p className="text-body mt-1 text-muted">{message}</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-surface p-5">
        <p className="text-[14px] font-semibold text-ink">Enter your roof details manually</p>
        <p className="text-small mt-1 text-muted">
          A rough estimate — good enough to keep going.
        </p>

        <div className="mt-4 flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink">
              Usable roof area (m²)
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={area}
              onChange={(e) => onAreaChange(e.target.value)}
              placeholder="e.g. 40"
              className="w-full rounded-lg border border-line bg-surface-alt px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-primary focus:bg-surface"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink">
              Main roof orientation
            </span>
            <select
              value={azimuth}
              onChange={(e) => onAzimuthChange(Number(e.target.value))}
              className="w-full rounded-lg border border-line bg-surface-alt px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-primary focus:bg-surface"
            >
              {ORIENTATIONS.map((o) => (
                <option key={o.azimuth} value={o.azimuth}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink">
              Roof pitch (degrees)
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={60}
              value={pitch}
              onChange={(e) => onPitchChange(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface-alt px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-primary focus:bg-surface"
            />
          </label>
        </div>

        <Button fullWidth className="mt-5" disabled={!areaValid} onClick={onSubmit}>
          Continue with this estimate
        </Button>
      </div>
    </div>
  );
}
