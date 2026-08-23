"use client";

import BottomCTA from "@/components/ui/BottomCTA";
import Button from "@/components/ui/Button";
import StepIndicator from "@/components/ui/StepIndicator";
import { estimateAnnualUsage, getBillSeason } from "@/lib/consumption/estimate";
import type { HoursBucket, Season } from "@/lib/consumption/types";
import { loadBillFlow, saveBillFlow, type BillFlowState } from "@/lib/billFlow";
import { fetchAnnualLoad } from "@/lib/annualLoad/client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type HomeDuringDay = BillFlowState["homeDuringDay"];
type StepKind = "occupancy" | "heating" | "cooling" | "appliances";

const STEP_TITLES: Record<StepKind, string> = {
  occupancy: "Daytime occupancy",
  heating: "Heating",
  cooling: "Cooling",
  appliances: "Other appliances",
};

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

  const [homeDuringDay, setHomeDuringDay] = useState<HomeDuringDay>(null);

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
    const flow = loadBillFlow();
    setHomeDuringDay(flow.homeDuringDay);
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

  // A winter bill already reflects heating; a summer bill already reflects
  // cooling — only ask about the one(s) this month's bill doesn't cover.
  const showHeating = billSeason !== "winter";
  const showCooling = billSeason !== "summer";
  const steps: StepKind[] = [
    "occupancy",
    ...(showHeating ? (["heating"] as const) : []),
    ...(showCooling ? (["cooling"] as const) : []),
    "appliances",
  ];
  const stepLabels = steps.map((kind) => STEP_TITLES[kind]);
  const currentKind = steps[step];

  const canAdvance =
    (currentKind === "occupancy" && homeDuringDay !== null) ||
    (currentKind === "heating" && heatingFlag !== null && (!heatingFlag || heatingHours !== null)) ||
    (currentKind === "cooling" && coolingFlag !== null && (!coolingFlag || coolingHours !== null)) ||
    (currentKind === "appliances" &&
      (!poolFlag || poolHours !== null) &&
      (!evFlag || evHours !== null) &&
      (!hotWaterFlag || hotWaterHours !== null));

  async function next() {
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
      ...consumptionInputs,
    });
    setSubmitting(false);
    const annualLoad = loadResponse.ok ? loadResponse.result : loadResponse.fallback;

    saveBillFlow({
      ...flow,
      homeDuringDay,
      ...consumptionInputs,
      // The backend's annual-load estimate is what actually sizes the
      // system on /roof; the local estimate above only supplies the $/rate
      // figures, which the backend doesn't produce.
      estimatedAnnualKwh: annualLoad.estimatedAnnualUsageKwh,
      estimatedAnnualKwhSource: annualLoad.source,
      estimatedAnnualBillDollars: estimate?.estimatedAnnualBillDollars ?? flow.estimatedAnnualBillDollars,
      ratePerKwhCents: estimate?.ratePerKwhCents ?? flow.ratePerKwhCents,
      rateSource: estimate?.rateSource ?? flow.rateSource,
    });
    router.push("/roof");
  }

  function back() {
    if (step === 0) router.push("/scan");
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
          <StepIndicator steps={stepLabels} current={step} />
        </div>

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
            ) : step === steps.length - 1 ? (
              "Continue"
            ) : (
              "Next"
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
