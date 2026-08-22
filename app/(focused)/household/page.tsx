"use client";

import BottomCTA from "@/components/ui/BottomCTA";
import Button from "@/components/ui/Button";
import StepIndicator from "@/components/ui/StepIndicator";
import { appliancesOptions, type HouseholdProfile } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Occupants = HouseholdProfile["occupants"];
type HomeDuringDay = HouseholdProfile["homeDuringDay"];
type StayDuration = HouseholdProfile["stayDuration"];

const STEP_LABELS = ["Household size", "Daytime occupancy", "Appliances", "Length of stay"];

export default function HouseholdPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [occupants, setOccupants] = useState<Occupants | null>(null);
  const [homeDuringDay, setHomeDuringDay] = useState<HomeDuringDay | null>(null);
  const [appliances, setAppliances] = useState<string[]>([]);
  const [stayDuration, setStayDuration] = useState<StayDuration | null>(null);

  const canAdvance =
    (step === 0 && occupants !== null) ||
    (step === 1 && homeDuringDay !== null) ||
    step === 2 ||
    (step === 3 && stayDuration !== null);

  function next() {
    if (step < STEP_LABELS.length - 1) {
      setStep((s) => s + 1);
    } else {
      router.push("/roof");
    }
  }

  function back() {
    if (step === 0) router.push("/scan");
    else setStep((s) => s - 1);
  }

  function toggleAppliance(id: string) {
    setAppliances((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex w-full flex-1 flex-col pt-4">
        <h1 className="text-h1 text-ink">About your household</h1>
        <div className="mt-4">
          <StepIndicator steps={STEP_LABELS} current={step} />
        </div>
        {step === 0 && (
          <Question title="How many people live here?">
            <div className="grid grid-cols-2 gap-3">
              {(["1", "2", "3-4", "5+"] as Occupants[]).map((opt) => (
                <OptionButton
                  key={opt}
                  selected={occupants === opt}
                  onClick={() => setOccupants(opt)}
                >
                  {opt} {opt === "1" ? "person" : "people"}
                </OptionButton>
              ))}
            </div>
          </Question>
        )}

        {step === 1 && (
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

        {step === 2 && (
          <Question title="What do you have?" subtitle="Select all that apply">
            <div className="flex flex-col gap-3">
              {appliancesOptions.map((opt) => (
                <OptionButton
                  key={opt.id}
                  selected={appliances.includes(opt.id)}
                  onClick={() => toggleAppliance(opt.id)}
                  multi
                >
                  {opt.label}
                </OptionButton>
              ))}
            </div>
          </Question>
        )}

        {step === 3 && (
          <Question title="How long do you plan to stay?">
            <div className="flex flex-col gap-3">
              {(
                [
                  { id: "under1", label: "Under 1 year" },
                  { id: "1-3", label: "1–3 years" },
                  { id: "3+", label: "3+ years" },
                  { id: "unsure", label: "Not sure" },
                ] as { id: StayDuration; label: string }[]
              ).map((opt) => (
                <OptionButton
                  key={opt.id}
                  selected={stayDuration === opt.id}
                  onClick={() => setStayDuration(opt.id)}
                >
                  {opt.label}
                </OptionButton>
              ))}
            </div>
          </Question>
        )}
      </div>

      <BottomCTA>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={back} className="w-24">
            Back
          </Button>
          <Button fullWidth disabled={!canAdvance} onClick={next}>
            {step === STEP_LABELS.length - 1 ? "Continue" : "Next"}
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
