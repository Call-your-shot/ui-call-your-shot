"use client";

import BottomCTA from "@/components/ui/BottomCTA";
import Button from "@/components/ui/Button";
import Callout from "@/components/ui/Callout";
import StatChip from "@/components/ui/StatChip";
import HouseIllustration from "@/components/civic/HouseIllustration";
import { loadBillFlow, saveBillFlow } from "@/lib/billFlow";
import { useDemo } from "@/lib/demo-context";
import { formatAddress, scenarios } from "@/lib/mockData";
import { fetchSolarData } from "@/lib/solar/client";
import { buildManualSolarResult } from "@/lib/solar/manualEstimate";
import { buildMockSolarResult } from "@/lib/solar/mockFallback";
import type { SolarApiResponse, SolarResult } from "@/lib/solar/types";
import { billFlowToPayload } from "@/lib/annualLoad/payload";
import type { AnnualLoadRequestPayload } from "@/lib/annualLoad/types";
import { ChevronDown, Grid2x2, Compass, Layers, MapPin } from "lucide-react";
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
  | { kind: "pending" }
  | { kind: "result"; result: SolarResult }
  | { kind: "geocode_failed"; message: string }
  | { kind: "no_coverage"; message: string };

export default function RoofPage() {
  const router = useRouter();
  const { scenario } = useDemo();
  const property = scenarios[scenario];

  const [loadingStep, setLoadingStep] = useState(0);
  const [minTimerDone, setMinTimerDone] = useState(false);
  const [outlineDrawn, setOutlineDrawn] = useState(false);
  const [panelsShown, setPanelsShown] = useState(0);
  const [noteOpen, setNoteOpen] = useState(false);

  const [houseTick, setHouseTick] = useState(0);
  const [houseStart, setHouseStart] = useState(0);

  const [apiPhase, setApiPhase] = useState<ApiPhase>({ kind: "pending" });
  // Loading ends only once BOTH the sequence's own minimum pacing has
  // elapsed AND real (or fallback) data has actually arrived — derived
  // directly rather than mirrored into its own state + effect.
  const loading = !minTimerDone || apiPhase.kind === "pending";
  const [addressInput, setAddressInput] = useState(() => formatAddress(property.address));
  const [targetAnnualKwh, setTargetAnnualKwh] = useState<number | undefined>(undefined);
  const [formData, setFormData] = useState<AnnualLoadRequestPayload | undefined>(undefined);
  const [estimatedAnnualBillDollars, setEstimatedAnnualBillDollars] = useState<number | undefined>(undefined);
  const [ratePerKwhCents, setRatePerKwhCents] = useState<number | undefined>(undefined);
  const [manualArea, setManualArea] = useState("");
  const [manualAzimuth, setManualAzimuth] = useState(0);
  const [manualPitch, setManualPitch] = useState("20");

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

  // Kick off the real (or mock) fetch in parallel with the timed loading
  // sequence below — the sequence's own pacing is untouched either way.
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const forceMock = params.get("mock") === "1";

    // Prefer the real address + estimated annual usage collected in the
    // scan/household steps; fall back to the fixed demo scenario when the
    // user landed here directly (e.g. during dev).
    const flow = loadBillFlow();
    const address = flow.address || formatAddress(property.address);
    const annualKwh = flow.estimatedAnnualKwh ?? undefined;
    // The full form collected across scan + household, so /api/solar isn't
    // limited to just the derived target number.
    const fullFormData = { ...billFlowToPayload(flow), address };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from sessionStorage after mount
    setAddressInput(address);
    setTargetAnnualKwh(annualKwh);
    setFormData(fullFormData);
    setEstimatedAnnualBillDollars(flow.estimatedAnnualBillDollars ?? undefined);
    setRatePerKwhCents(flow.ratePerKwhCents ?? undefined);

    fetchSolarData({
      address,
      scenario,
      targetAnnualKwh: annualKwh,
      formData: fullFormData,
      forceMock,
    }).then((res) => {
      if (!cancelled) applyResponse(res);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  useEffect(() => {
    const t = setTimeout(() => {
      setApiPhase((prev) =>
        prev.kind === "pending" ? { kind: "result", result: buildMockSolarResult(scenario) } : prev
      );
    }, SAFETY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [scenario]);

  function retryGeocode() {
    setApiPhase({ kind: "pending" });
    fetchSolarData({
      address: addressInput,
      scenario,
      targetAnnualKwh,
      formData: formData ? { ...formData, address: addressInput } : undefined,
    }).then(applyResponse);
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
    setApiPhase({ kind: "result", result });
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

  // Carry the resolved system through to /results and /create-proposal —
  // whichever result is currently on screen (real, retried, or manual).
  useEffect(() => {
    if (!result || !primarySegment) return;
    saveBillFlow({
      ...loadBillFlow(),
      solarSystem: {
        panelCount: result.system.panelCount,
        panelWatts: result.system.panelWatts,
        systemSizeKw: result.system.systemSizeKw,
        estimatedAnnualAcKwh: result.system.estimatedAnnualAcKwh,
        source: result.source,
        orientation: primarySegment.compassDirection,
        pitchDegrees: primarySegment.pitchDegrees,
      },
    });
  }, [result, primarySegment]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex w-full flex-1 flex-col pb-8">
        <h1 className="text-h1 mt-4 text-ink">Your roof</h1>

        {loading ? (
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
                Sized for ~{targetAnnualKwh.toLocaleString()} kWh/year, estimated from your bill and
                household answers.
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
          <Button fullWidth onClick={() => router.push("/results")}>
            See your numbers
          </Button>
        </BottomCTA>
      )}
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
