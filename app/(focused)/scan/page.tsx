"use client";

import BottomCTA from "@/components/ui/BottomCTA";
import Button from "@/components/ui/Button";
import { mockBillDetails, type BillDetails } from "@/lib/mockData";
import { Camera, Check, FileText, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Stage = "idle" | "scanning" | "review";

const scanSteps = [
  "Reading bill…",
  "Identifying retailer…",
  "Extracting usage…",
];

export default function ScanPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [bill, setBill] = useState<BillDetails>(mockBillDetails);

  function startScan() {
    setStage("scanning");
    setStepIndex(0);
  }

  useEffect(() => {
    if (stage !== "scanning") return;
    if (stepIndex >= scanSteps.length - 1) {
      const t = setTimeout(() => setStage("review"), 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStepIndex((i) => i + 1), 800);
    return () => clearTimeout(t);
  }, [stage, stepIndex]);

  function updateField<K extends keyof BillDetails>(key: K, value: BillDetails[K]) {
    setBill((b) => ({ ...b, [key]: value }));
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex w-full flex-1 flex-col pt-4 pb-8">
        <h1 className="text-h1 text-ink">Scan your bill</h1>
        {stage === "idle" && (
          <div className="flex flex-1 flex-col">
            <p className="text-body mt-1 text-muted">
              Snap a photo of your latest electricity bill and we&apos;ll pull
              out the details automatically.
            </p>

            <button
              type="button"
              onClick={startScan}
              className="mt-6 flex min-h-64 flex-1 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-primary-light/50 bg-surface-alt px-6 py-10 text-center hover:border-primary hover:bg-secondary-light/30"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
                <Camera size={26} aria-hidden="true" />
              </div>
              <p className="text-h3 text-ink">Tap to take a photo or upload</p>
              <p className="text-small text-muted">
                JPG, PNG or PDF — we&apos;ll do the rest
              </p>
              <span className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-semibold text-white">
                <Upload size={15} aria-hidden="true" />
                Upload bill
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStage("review")}
              className="mt-5 text-center text-small font-semibold text-primary underline underline-offset-2"
            >
              Enter details manually instead
            </button>
          </div>
        )}

        {stage === "scanning" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <Loader2 size={80} className="animate-spin text-accent" strokeWidth={1.5} aria-hidden="true" />
              <FileText size={30} className="absolute text-primary" aria-hidden="true" />
            </div>
            <div className="flex flex-col items-center gap-2" role="status" aria-live="polite">
              {scanSteps.map((step, i) => (
                <p
                  key={step}
                  className={
                    i === stepIndex
                      ? "text-[15px] font-semibold text-ink"
                      : i < stepIndex
                        ? "flex items-center gap-1.5 text-small text-success"
                        : "text-small text-muted"
                  }
                >
                  {i < stepIndex && <Check size={14} aria-hidden="true" />}
                  {step}
                </p>
              ))}
            </div>
          </div>
        )}

        {stage === "review" && (
          <div className="animate-fade-up">
            <p className="text-body mt-1 text-muted">
              Here&apos;s what we found. Check it over and fix anything that&apos;s off.
            </p>

            {/* Bill facsimile */}
            <div className="mt-5 overflow-hidden rounded-lg border border-line bg-surface">
              <div className="flex items-center justify-between bg-primary px-5 py-4 text-white">
                <div>
                  <p className="text-[11px] font-semibold tracking-wide uppercase opacity-80">
                    Electricity bill — extracted
                  </p>
                  <p className="text-h3 mt-0.5 text-white">{bill.retailer}</p>
                </div>
                <FileText size={26} className="opacity-70" aria-hidden="true" />
              </div>

              <div className="flex flex-col gap-4 p-5">
                <FieldRow label="Retailer" value={bill.retailer} onChange={(v) => updateField("retailer", v)} />
                <FieldRow label="Plan" value={bill.planName} onChange={(v) => updateField("planName", v)} />
                <FieldRow label="Tariff type" value={bill.tariffType} onChange={(v) => updateField("tariffType", v)} />

                <div className="border-t border-line pt-4">
                  <p className="text-[12px] font-semibold tracking-wide text-muted uppercase">
                    Rates
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    <NumberFieldRow
                      label="Peak c/kWh"
                      value={bill.peakRateCents}
                      onChange={(v) => updateField("peakRateCents", v)}
                    />
                    <NumberFieldRow
                      label="Shoulder c/kWh"
                      value={bill.shoulderRateCents}
                      onChange={(v) => updateField("shoulderRateCents", v)}
                    />
                    <NumberFieldRow
                      label="Off-peak c/kWh"
                      value={bill.offPeakRateCents}
                      onChange={(v) => updateField("offPeakRateCents", v)}
                    />
                  </div>
                </div>

                <div className="border-t border-line pt-4">
                  <p className="text-[12px] font-semibold tracking-wide text-muted uppercase">
                    Usage
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <NumberFieldRow
                      label="Daily supply $"
                      value={bill.dailySupplyChargeDollars}
                      onChange={(v) => updateField("dailySupplyChargeDollars", v)}
                    />
                    <NumberFieldRow
                      label="Avg. daily usage kWh"
                      value={bill.averageDailyUsageKwh}
                      onChange={(v) => updateField("averageDailyUsageKwh", v)}
                    />
                  </div>
                </div>

                <div className="border-t border-line pt-4">
                  <p className="text-[12px] font-semibold tracking-wide text-muted uppercase">
                    Billing period
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <FieldRow
                      label="Period start"
                      value={bill.billingPeriodStart}
                      onChange={(v) => updateField("billingPeriodStart", v)}
                      type="date"
                    />
                    <FieldRow
                      label="Period end"
                      value={bill.billingPeriodEnd}
                      onChange={(v) => updateField("billingPeriodEnd", v)}
                      type="date"
                    />
                  </div>
                </div>

                <div className="border-t border-line pt-4">
                  <FieldRow
                    label="Address"
                    value={`${bill.address.street}, ${bill.address.suburb} ${bill.address.state} ${bill.address.postcode}`}
                    onChange={(v) =>
                      setBill((b) => ({ ...b, address: { ...b.address, street: v } }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {stage === "review" && (
        <BottomCTA>
          <Button fullWidth onClick={() => router.push("/household")}>
            Confirm details
          </Button>
        </BottomCTA>
      )}
    </div>
  );
}

function FieldRow({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[13px] font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line bg-surface-alt px-3 py-2.5 text-right text-[15px] font-medium text-ink outline-none focus:border-primary focus:bg-surface"
      />
    </div>
  );
}

function NumberFieldRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[13px] font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-md border border-line bg-surface-alt px-3 py-2.5 text-right text-[15px] font-medium text-ink outline-none focus:border-primary focus:bg-surface"
      />
    </div>
  );
}
