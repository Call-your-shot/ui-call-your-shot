"use client";

import BottomCTA from "@/components/ui/BottomCTA";
import Button from "@/components/ui/Button";
import StepIndicator from "@/components/ui/StepIndicator";
import { estimateAnnualUsage, getBillSeason } from "@/lib/consumption/estimate";
import type { HoursBucket, Season } from "@/lib/consumption/types";
import {
  emptyBillFlow,
  lastMonthRange,
  loadBillFlow,
  resetBillFlow,
  saveBillFlow,
  type BillFlowState,
} from "@/lib/billFlow";
import type { AddressApiResponse } from "@/app/api/address/route";
import type { BillApiResponse } from "@/lib/bill/types";
import { fetchAnnualLoad } from "@/lib/annualLoad/client";
import { cn } from "@/lib/utils";
import { AlertTriangle, Camera, Loader2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type HomeDuringDay = BillFlowState["homeDuringDay"];
type StepKind = "property" | "occupants" | "occupancy" | "heating" | "cooling" | "appliances";
type AddressStatus = "idle" | "checking" | "valid" | "invalid";

const HOURS_OPTIONS: { id: HoursBucket; label: string }[] = [
  { id: "0-2", label: "0–2 hrs/day" },
  { id: "2-4", label: "2–4 hrs/day" },
  { id: "4-8", label: "4–8 hrs/day" },
  { id: "8+", label: "8+ hrs/day" },
];

export default function HouseholdPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(0);
  const [billSeason, setBillSeason] = useState<Season>("winter");

  const [address, setAddress] = useState("");
  const [addressStatus, setAddressStatus] = useState<AddressStatus>("idle");
  const [addressMessage, setAddressMessage] = useState("");
  const [billingPeriodStart, setBillingPeriodStart] = useState("");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState("");
  const [usageKwh, setUsageKwh] = useState<number | null>(null);
  const [billTotalCostDollars, setBillTotalCostDollars] = useState<number | null>(null);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "error">("idle");
  const [scanError, setScanError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [homeDuringDay, setHomeDuringDay] = useState<HomeDuringDay>(null);
  const [occupantCount, setOccupantCount] = useState(1);

  const [heatingFlag, setHeatingFlag] = useState<boolean | null>(null);
  const [heatingHours, setHeatingHours] = useState<HoursBucket | null>(null);
  const [coolingFlag, setCoolingFlag] = useState<boolean | null>(null);
  const [coolingHours, setCoolingHours] = useState<HoursBucket | null>(null);

  const [poolFlag, setPoolFlag] = useState(false);
  const [poolHours, setPoolHours] = useState<HoursBucket | null>(null);
  const [evFlag, setEvFlag] = useState(false);
  const [evHours, setEvHours] = useState<HoursBucket | null>(null);
  const [hotWaterFlag, setHotWaterFlag] = useState(false);
  const [hotWaterHours, setHotWaterHours] = useState<HoursBucket | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Resume any in-progress answers, and work out which of the seasonal
  // questions are even worth asking (the bill's own season is already
  // covered, so there's no point asking about it).
  /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from sessionStorage after mount */
  useEffect(() => {
    const isNewAssessment = new URLSearchParams(window.location.search).get("new") === "1";
    if (isNewAssessment) {
      resetBillFlow();
      window.history.replaceState(window.history.state, "", "/household");
    }
    const range = lastMonthRange();
    const flow = isNewAssessment
      ? { ...emptyBillFlow, billingPeriodStart: range.start, billingPeriodEnd: range.end }
      : loadBillFlow();
    setAddress(flow.address);
    setBillingPeriodStart(flow.billingPeriodStart || range.start);
    setBillingPeriodEnd(flow.billingPeriodEnd || range.end);
    setUsageKwh(flow.usageKwh);
    setBillTotalCostDollars(flow.billTotalCostDollars);
    setHomeDuringDay(flow.homeDuringDay);
    setOccupantCount(flow.occupantCount);
    setHeatingFlag(flow.heatingNotUsedThisMonth);
    setHeatingHours(flow.heatingHours);
    setCoolingFlag(flow.coolingNotUsedThisMonth);
    setCoolingHours(flow.coolingHours);
    setPoolFlag(flow.poolNotUsedThisMonth);
    setPoolHours(flow.poolHours);
    setEvFlag(flow.evNotUsedThisMonth);
    setEvHours(flow.evHours);
    setHotWaterFlag(flow.hotWaterNotUsedThisMonth);
    setHotWaterHours(flow.hotWaterHours);
    if (flow.billingPeriodStart && flow.billingPeriodEnd) {
      setBillSeason(getBillSeason(flow.billingPeriodStart, flow.billingPeriodEnd));
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated || !address.trim()) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- begins debounced address verification
    setAddressStatus("checking");
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch("/api/address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
        const result = (await response.json()) as AddressApiResponse;
        if (result.ok && result.formattedAddress) {
          setAddressStatus("valid");
          setAddressMessage(result.formattedAddress);
        } else {
          setAddressStatus("invalid");
          setAddressMessage(result.message ?? "We couldn't find that address");
        }
      } catch {
        setAddressStatus("valid");
        setAddressMessage(address.trim());
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [address, hydrated]);

  async function handleBillFile(file: File) {
    if (file.size > 15 * 1024 * 1024) {
      setScanError("That file is too large — try a smaller photo or PDF.");
      setScanStatus("error");
      return;
    }
    setScanStatus("scanning");
    setScanError("");

    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const [, base64] = dataUrl.split(",");

    try {
      const response = await fetch("/api/bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type || "application/octet-stream" }),
      });
      const data = (await response.json()) as BillApiResponse;

      if (!data.ok) {
        setScanError(data.message);
        setScanStatus("error");
        return;
      }

      setAddress(data.result.address);
      setAddressStatus("idle");
      setAddressMessage("");
      setBillingPeriodStart(data.result.billingPeriodStart);
      setBillingPeriodEnd(data.result.billingPeriodEnd);
      setUsageKwh(data.result.usageKwh || null);
      setBillTotalCostDollars(data.result.totalCostDollars || null);
      setScanStatus("idle");
    } catch {
      setScanError("Something went wrong reading that file — try again or enter details manually.");
      setScanStatus("error");
    }
  }

  // A winter bill already reflects heating; a summer bill already reflects
  // cooling — only ask about the one(s) this month's bill doesn't cover.
  const showHeating = billSeason !== "winter";
  const showCooling = billSeason !== "summer";
  const steps: StepKind[] = [
    "property",
    "occupants",
    "occupancy",
    ...(showHeating ? (["heating"] as const) : []),
    ...(showCooling ? (["cooling"] as const) : []),
    "appliances",
  ];
  const currentKind = steps[step];
  const progressSteps = ["Property & electricity use", "Household", "Appliances"];
  const progressStep = currentKind === "property" ? 0 : currentKind === "appliances" ? 2 : 1;

  const canAdvance =
    (currentKind === "property" &&
      address.trim().length >= 3 && addressStatus === "valid" &&
      usageKwh !== null && usageKwh > 0 &&
      !!billingPeriodStart && !!billingPeriodEnd &&
      billingPeriodEnd > billingPeriodStart &&
      (billTotalCostDollars === null || billTotalCostDollars >= 0)) ||
    (currentKind === "occupants" && occupantCount > 0) ||
    (currentKind === "occupancy" && homeDuringDay !== null) ||
    (currentKind === "heating" && heatingFlag !== null && (!heatingFlag || heatingHours !== null)) ||
    (currentKind === "cooling" && coolingFlag !== null && (!coolingFlag || coolingHours !== null)) ||
    (currentKind === "appliances" &&
      (!poolFlag || poolHours !== null) &&
      (!evFlag || evHours !== null) &&
      (!hotWaterFlag || hotWaterHours !== null));

  async function next() {
    if (currentKind === "property") {
      const formattedAddress = addressMessage || address.trim();
      saveBillFlow({
        ...loadBillFlow(),
        address: formattedAddress,
        billingPeriodStart,
        billingPeriodEnd,
        usageKwh,
        billTotalCostDollars,
      });
      setAddress(formattedAddress);
      setBillSeason(getBillSeason(billingPeriodStart, billingPeriodEnd));
      setStep((s) => s + 1);
      return;
    }

    if (step < steps.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    const flow = loadBillFlow();
    const finalHeatingFlag = showHeating ? !!heatingFlag : false;
    const finalCoolingFlag = showCooling ? !!coolingFlag : false;

    // Shared by both the local estimate (for the on-screen kWh/$ figures)
    // and the JSON payload we hand to the sizing backend.
    const consumptionInputs = {
      billUsageKwh: flow.usageKwh ?? 0,
      billingPeriodStart: flow.billingPeriodStart,
      billingPeriodEnd: flow.billingPeriodEnd,
      billTotalCostDollars: flow.billTotalCostDollars,
      heatingNotUsedThisMonth: finalHeatingFlag,
      heatingHours: finalHeatingFlag ? heatingHours : null,
      coolingNotUsedThisMonth: finalCoolingFlag,
      coolingHours: finalCoolingFlag ? coolingHours : null,
      poolNotUsedThisMonth: poolFlag,
      poolHours,
      evNotUsedThisMonth: evFlag,
      evHours,
      hotWaterNotUsedThisMonth: hotWaterFlag,
      hotWaterHours,
    };

    // $/rate figures aren't something the backend estimates — always derive
    // those locally from the bill.
    const estimate =
      flow.usageKwh && flow.billingPeriodStart && flow.billingPeriodEnd
        ? estimateAnnualUsage(consumptionInputs)
        : null;

    setSubmitting(true);
    const loadResponse = await fetchAnnualLoad({
      address: flow.address,
      homeDuringDay,
      occupantCount,
      ...consumptionInputs,
    });
    setSubmitting(false);
    const annualLoad = loadResponse.ok ? loadResponse.result : loadResponse.fallback;

    saveBillFlow({
      ...flow,
      homeDuringDay,
      occupantCount,
      ...consumptionInputs,
      // The backend's annual-load estimate is what actually sizes the
      // system on /roof; the local estimate above only supplies the $/rate
      // figures, which the backend doesn't produce.
      estimatedAnnualKwh: annualLoad.estimatedAnnualUsageKwh,
      estimatedAnnualBillDollars: estimate?.estimatedAnnualBillDollars ?? flow.estimatedAnnualBillDollars,
      ratePerKwhCents: estimate?.ratePerKwhCents ?? flow.ratePerKwhCents,
      monthlyUsage: annualLoad.monthlyUsage,
      usageProfileSource: annualLoad.profileSource,
      usageDataQuality: annualLoad.dataQuality,
    });
    router.push("/roof");
  }

  function back() {
    if (step === 0) router.push("/dashboard");
    else setStep((s) => s - 1);
  }

  // Avoids briefly rendering the wrong (season-independent) step list before
  // sessionStorage has been read.
  if (!hydrated) return <div className="flex flex-1 flex-col" />;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex w-full flex-1 flex-col pt-4">
        <h1 className="text-h1 text-ink">About your household</h1>
        <div className="mt-4">
          <StepIndicator steps={progressSteps} current={progressStep} />
        </div>

        {currentKind === "property" && (
          <Question
            title="Which home should we assess, and how much electricity does it use?"
            subtitle="Scan a photo of your electricity bill and we'll fill in everything below automatically — or just type it in."
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleBillFile(file);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanStatus === "scanning"}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary-light/50 bg-surface-alt px-4 py-4 text-center hover:border-primary hover:bg-secondary-light/30 disabled:opacity-60"
            >
              {scanStatus === "scanning" ? (
                <>
                  <Loader2 size={18} className="animate-spin text-primary" aria-hidden="true" />
                  <span className="text-[14px] font-semibold text-ink">Reading your bill…</span>
                </>
              ) : (
                <>
                  <Camera size={18} className="text-primary" aria-hidden="true" />
                  <span className="text-[14px] font-semibold text-ink">Scan a photo or PDF of your bill</span>
                </>
              )}
            </button>
            {scanStatus === "error" && (
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-warning">
                <AlertTriangle size={13} aria-hidden="true" />
                {scanError}
              </p>
            )}
            <p className="my-4 text-center text-[11px] font-semibold tracking-wide text-muted uppercase">
              Or enter it manually
            </p>
            <label htmlFor="assessment-address" className="block text-[13px] font-semibold text-muted">
              Property address
            </label>
            <input
              id="assessment-address"
              type="text"
              autoComplete="street-address"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                setAddressStatus("idle");
                setAddressMessage("");
              }}
              placeholder="e.g. 12 Example Street, Wollongong NSW 2500"
              className="mt-2 w-full rounded-lg border border-line bg-surface px-4 py-3 text-[15px] font-medium text-ink outline-none focus:border-primary"
            />
            <div className="mt-2 flex min-h-5 items-center gap-1.5 text-[12px]">
              {addressStatus === "checking" && (
                <><Loader2 size={13} className="animate-spin text-muted" /><span className="text-muted">Checking address…</span></>
              )}
              {addressStatus === "valid" && (
                <><MapPin size={13} className="text-success" /><span className="text-success">{addressMessage}</span></>
              )}
              {addressStatus === "invalid" && (
                <><AlertTriangle size={13} className="text-warning" /><span className="text-warning">{addressMessage}</span></>
              )}
            </div>

            <div className="mt-6 rounded-lg border border-line bg-surface p-5">
              <p className="text-[12px] font-semibold tracking-wide text-muted uppercase">
                Electricity usage
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <DateField label="Period start" value={billingPeriodStart} onChange={setBillingPeriodStart} />
                <DateField label="Period end" value={billingPeriodEnd} onChange={setBillingPeriodEnd} />
              </div>
              <label htmlFor="assessment-usage" className="mt-5 block text-[13px] font-semibold text-muted">
                Electricity used this period (kWh)
              </label>
              <input
                id="assessment-usage"
                type="number"
                inputMode="decimal"
                min={0}
                step="1"
                value={usageKwh ?? ""}
                onChange={(event) => setUsageKwh(event.target.value ? Number(event.target.value) : null)}
                placeholder="e.g. 420"
                className="mt-2 w-full rounded-lg border border-line bg-surface-alt px-4 py-3 text-[15px] font-medium text-ink outline-none focus:border-primary focus:bg-surface"
              />
              <label htmlFor="assessment-cost" className="mt-5 block text-[13px] font-semibold text-muted">
                Total bill amount ($) <span className="font-normal">— optional</span>
              </label>
              <input
                id="assessment-cost"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={billTotalCostDollars ?? ""}
                onChange={(event) => setBillTotalCostDollars(event.target.value ? Number(event.target.value) : null)}
                placeholder="e.g. 140.50"
                className="mt-2 w-full rounded-lg border border-line bg-surface-alt px-4 py-3 text-[15px] font-medium text-ink outline-none focus:border-primary focus:bg-surface"
              />
            </div>
          </Question>
        )}

        {currentKind === "occupants" && (
          <Question
            title="How many people live here?"
            subtitle="Household size helps us sense-check the monthly demand profile. Your electricity bill remains the primary source."
          >
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <OptionButton key={count} selected={occupantCount === count} onClick={() => setOccupantCount(count)}>
                  {count === 6 ? "6+" : count}
                </OptionButton>
              ))}
            </div>
          </Question>
        )}

        {currentKind === "occupancy" && (
          <Question title="Is anyone usually home during the day?">
            <div className="flex flex-col gap-3">
              {(
                [
                  { id: "most", label: "Yes, most days" },
                  { id: "sometimes", label: "Sometimes" },
                  { id: "rarely", label: "Rarely" },
                ] as { id: HomeDuringDay; label: string }[]
              ).map((opt) => (
                <OptionButton
                  key={opt.id}
                  selected={homeDuringDay === opt.id}
                  onClick={() => setHomeDuringDay(opt.id)}
                >
                  {opt.label}
                </OptionButton>
              ))}
            </div>
          </Question>
        )}

        {currentKind === "heating" && (
          <Question
            title="Do you use heating in winter, which you're not using this month?"
            subtitle="We already have your bill for this month — we only need to know about appliances it doesn't cover."
          >
            <div className="flex flex-col gap-3">
              <OptionButton
                selected={heatingFlag === false}
                onClick={() => {
                  setHeatingFlag(false);
                  setHeatingHours(null);
                }}
              >
                No
              </OptionButton>
              <OptionButton selected={heatingFlag === true} onClick={() => setHeatingFlag(true)}>
                Yes
              </OptionButton>
            </div>
            {heatingFlag && (
              <HoursPicker value={heatingHours} onChange={setHeatingHours} />
            )}
          </Question>
        )}

        {currentKind === "cooling" && (
          <Question
            title="Do you use air conditioning in summer, which you're not using this month?"
            subtitle="Same idea — just the appliances this month's bill doesn't already cover."
          >
            <div className="flex flex-col gap-3">
              <OptionButton
                selected={coolingFlag === false}
                onClick={() => {
                  setCoolingFlag(false);
                  setCoolingHours(null);
                }}
              >
                No
              </OptionButton>
              <OptionButton selected={coolingFlag === true} onClick={() => setCoolingFlag(true)}>
                Yes
              </OptionButton>
            </div>
            {coolingFlag && (
              <HoursPicker value={coolingHours} onChange={setCoolingHours} />
            )}
          </Question>
        )}

        {currentKind === "appliances" && (
          <Question
            title="Do you have any of these which you didn't use this month?"
            subtitle="This month's bill already covers whatever you are using — we're only asking about the rest."
          >
            <div className="flex flex-col gap-5">
              <ApplianceRow
                label="Pool pump"
                flag={poolFlag}
                hours={poolHours}
                onFlag={(v) => {
                  setPoolFlag(v);
                  if (!v) setPoolHours(null);
                }}
                onHours={setPoolHours}
              />
              <ApplianceRow
                label="Electric vehicle charging"
                flag={evFlag}
                hours={evHours}
                onFlag={(v) => {
                  setEvFlag(v);
                  if (!v) setEvHours(null);
                }}
                onHours={setEvHours}
              />
              <ApplianceRow
                label="Electric hot water"
                flag={hotWaterFlag}
                hours={hotWaterHours}
                onFlag={(v) => {
                  setHotWaterFlag(v);
                  if (!v) setHotWaterHours(null);
                }}
                onHours={setHotWaterHours}
              />
            </div>
          </Question>
        )}
      </div>

      <BottomCTA>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={back} className="w-24" disabled={submitting}>
            Back
          </Button>
          <Button fullWidth disabled={!canAdvance || submitting} onClick={next}>
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Estimating your usage…
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </BottomCTA>
    </div>
  );
}

function Question({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-up">
      <h2 className="text-h1 text-ink">{title}</h2>
      {subtitle && <p className="text-body mt-1 text-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `assessment-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <label htmlFor={id} className="block">
      <span className="block text-[13px] font-semibold text-muted">{label}</span>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-line bg-surface-alt px-3 py-3 text-[14px] font-medium text-ink outline-none focus:border-primary focus:bg-surface"
      />
    </label>
  );
}

function HoursPicker({
  value,
  onChange,
}: {
  value: HoursBucket | null;
  onChange: (v: HoursBucket) => void;
}) {
  return (
    <div className="animate-fade-up mt-5">
      <p className="text-body mb-3 text-muted">Roughly how long per day, when you do use it?</p>
      <div className="grid grid-cols-2 gap-3">
        {HOURS_OPTIONS.map((opt) => (
          <OptionButton key={opt.id} selected={value === opt.id} onClick={() => onChange(opt.id)}>
            {opt.label}
          </OptionButton>
        ))}
      </div>
    </div>
  );
}

function ApplianceRow({
  label,
  flag,
  hours,
  onFlag,
  onHours,
}: {
  label: string;
  flag: boolean;
  hours: HoursBucket | null;
  onFlag: (v: boolean) => void;
  onHours: (v: HoursBucket) => void;
}) {
  return (
    <div>
      <OptionButton selected={flag} onClick={() => onFlag(!flag)} multi>
        {label}
      </OptionButton>
      {flag && <HoursPicker value={hours} onChange={onHours} />}
    </div>
  );
}

function OptionButton({
  selected,
  onClick,
  children,
  multi,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-16 items-center justify-between rounded-lg border-2 px-5 py-4 text-left text-[16px] font-semibold transition-colors duration-200",
        selected
          ? "border-primary bg-secondary-light text-primary-dark"
          : "border-line bg-surface text-ink hover:border-primary-light"
      )}
    >
      {children}
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center border-2",
          multi ? "rounded-md" : "rounded-full",
          selected ? "border-primary bg-primary" : "border-line bg-surface"
        )}
      >
        {selected && (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-white stroke-[2.5]">
            <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}
