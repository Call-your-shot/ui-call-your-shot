"use client";

import BottomCTA from "@/components/ui/BottomCTA";
import Button from "@/components/ui/Button";
import { loadBillFlow, saveBillFlow, lastMonthRange } from "@/lib/billFlow";
import type { AddressApiResponse } from "@/app/api/address/route";
import type { BillApiResponse } from "@/lib/bill/types";
import { AlertTriangle, Camera, FileText, Loader2, MapPin, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Stage = "idle" | "scanning" | "review" | "manual" | "error";
type AddressStatus = "idle" | "checking" | "valid" | "invalid";

const scanSteps = ["Reading bill…", "Identifying address…", "Extracting usage…"];

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const [address, setAddress] = useState("");
  const [addressStatus, setAddressStatus] = useState<AddressStatus>("idle");
  const [addressMessage, setAddressMessage] = useState("");
  const [billingPeriodStart, setBillingPeriodStart] = useState("");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState("");
  const [usageKwh, setUsageKwh] = useState<number | null>(null);
  const [totalCostDollars, setTotalCostDollars] = useState<number | null>(null);
  const [retailer, setRetailer] = useState("");

  useEffect(() => {
    if (stage !== "scanning") return;
    const t = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, scanSteps.length - 1));
    }, 700);
    return () => clearInterval(t);
  }, [stage]);

  // Debounced address validation whenever the address field changes in
  // review/manual mode.
  useEffect(() => {
    if (stage !== "review" && stage !== "manual") return;
    if (!address.trim()) return; // empty address renders as "idle" — nothing to validate
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the debounced validation below
    setAddressStatus("checking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
        const data = (await res.json()) as AddressApiResponse;
        if (data.ok && data.formattedAddress) {
          setAddressStatus("valid");
          setAddressMessage(data.formattedAddress);
        } else {
          setAddressStatus("invalid");
          setAddressMessage(data.message ?? "We couldn't find that address");
        }
      } catch {
        setAddressStatus("invalid");
        setAddressMessage("Couldn't check that address — check your connection and try again");
      }
    }, 600);
    return () => clearTimeout(t);
  }, [address, stage]);

  function startManual() {
    const range = lastMonthRange();
    setBillingPeriodStart(range.start);
    setBillingPeriodEnd(range.end);
    setUsageKwh(null);
    setTotalCostDollars(null);
    setAddress("");
    setAddressStatus("idle");
    setStage("manual");
  }

  async function handleFile(file: File) {
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("That file is too large — try a smaller photo or PDF.");
      setStage("error");
      return;
    }
    setStage("scanning");
    setStepIndex(0);

    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const [, base64] = dataUrl.split(",");

    try {
      const res = await fetch("/api/bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type || "application/octet-stream" }),
      });
      const data = (await res.json()) as BillApiResponse;

      if (!data.ok) {
        setErrorMessage(data.message);
        setStage("error");
        return;
      }

      setAddress(data.result.address);
      setBillingPeriodStart(data.result.billingPeriodStart);
      setBillingPeriodEnd(data.result.billingPeriodEnd);
      setUsageKwh(data.result.usageKwh || null);
      setTotalCostDollars(data.result.totalCostDollars || null);
      setRetailer(data.result.retailer);
      setStage("review");
    } catch {
      setErrorMessage("Something went wrong reading that file — try again or enter details manually.");
      setStage("error");
    }
  }

  // An emptied address field is always "idle", regardless of whatever the
  // last debounced check returned — computed at render instead of mirrored
  // into state via an effect.
  const displayedAddressStatus: AddressStatus = address.trim() ? addressStatus : "idle";

  function confirmDetails() {
    const flow = loadBillFlow();
    saveBillFlow({
      ...flow,
      address: displayedAddressStatus === "valid" ? addressMessage : address,
      billingPeriodStart,
      billingPeriodEnd,
      usageKwh,
      billTotalCostDollars: totalCostDollars,
    });
    router.push("/household");
  }

  const canConfirm =
    (stage === "review" || stage === "manual") &&
    displayedAddressStatus === "valid" &&
    !!usageKwh &&
    usageKwh > 0 &&
    !!billingPeriodStart &&
    !!billingPeriodEnd;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex w-full flex-1 flex-col pt-4 pb-8">
        <h1 className="text-h1 text-ink">Scan your bill</h1>

        {stage === "idle" && (
          <div className="flex flex-1 flex-col">
            <p className="text-body mt-1 text-muted">
              Upload a photo or PDF of your latest electricity bill and
              we&apos;ll pull out your address and usage automatically.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 flex min-h-64 flex-1 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-primary-light/50 bg-surface-alt px-6 py-10 text-center hover:border-primary hover:bg-secondary-light/30"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
                <Camera size={26} aria-hidden="true" />
              </div>
              <p className="text-h3 text-ink">Tap to take a photo or upload</p>
              <p className="text-small text-muted">JPG, PNG or PDF — we&apos;ll do the rest</p>
              <span className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-semibold text-white">
                <Upload size={15} aria-hidden="true" />
                Upload bill
              </span>
            </button>

            <button
              type="button"
              onClick={startManual}
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
                        ? "text-small text-success"
                        : "text-small text-muted"
                  }
                >
                  {step}
                </p>
              ))}
            </div>
          </div>
        )}

        {stage === "error" && (
          <div className="animate-fade-up flex flex-1 flex-col items-center justify-center gap-4 pt-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-warning-light text-warning">
              <AlertTriangle size={26} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-h3 text-ink">Couldn&apos;t read that bill</h2>
              <p className="text-body mt-1 text-muted">{errorMessage}</p>
            </div>
            <div className="flex w-full max-w-sm flex-col gap-3">
              <Button fullWidth onClick={() => setStage("idle")}>
                Try another file
              </Button>
              <Button variant="secondary" fullWidth onClick={startManual}>
                Enter details manually
              </Button>
            </div>
          </div>
        )}

        {(stage === "review" || stage === "manual") && (
          <div className="animate-fade-up">
            <p className="text-body mt-1 text-muted">
              {stage === "review"
                ? "Here's what we found. Check it over and fix anything that's off."
                : "Enter your address and last month's usage."}
            </p>

            <div className="mt-5 overflow-hidden rounded-lg border border-line bg-surface">
              <div className="flex items-center justify-between bg-primary px-5 py-4 text-white">
                <div>
                  <p className="text-[11px] font-semibold tracking-wide uppercase opacity-80">
                    {stage === "review" ? "Electricity bill — extracted" : "Manual entry"}
                  </p>
                  <p className="text-h3 mt-0.5 text-white">{retailer || "Your bill"}</p>
                </div>
                <FileText size={26} className="opacity-70" aria-hidden="true" />
              </div>

              <div className="flex flex-col gap-4 p-5">
                <div>
                  <label htmlFor="address" className="mb-1 block text-[13px] font-semibold text-muted">
                    Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 12 Example Street, Wollongong NSW 2500"
                    className="w-full rounded-md border border-line bg-surface-alt px-3 py-2.5 text-[15px] font-medium text-ink outline-none focus:border-primary focus:bg-surface"
                  />
                  <div className="mt-1.5 flex items-center gap-1.5 text-[12px]">
                    {displayedAddressStatus === "checking" && (
                      <>
                        <Loader2 size={12} className="animate-spin text-muted" aria-hidden="true" />
                        <span className="text-muted">Checking address…</span>
                      </>
                    )}
                    {displayedAddressStatus === "valid" && (
                      <>
                        <MapPin size={12} className="text-success" aria-hidden="true" />
                        <span className="text-success">{addressMessage}</span>
                      </>
                    )}
                    {displayedAddressStatus === "invalid" && (
                      <>
                        <AlertTriangle size={12} className="text-warning" aria-hidden="true" />
                        <span className="text-warning">{addressMessage}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-line pt-4">
                  <p className="text-[12px] font-semibold tracking-wide text-muted uppercase">
                    Billing period
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <DateField label="Period start" value={billingPeriodStart} onChange={setBillingPeriodStart} />
                    <DateField label="Period end" value={billingPeriodEnd} onChange={setBillingPeriodEnd} />
                  </div>
                </div>

                <div className="border-t border-line pt-4">
                  <label htmlFor="usage" className="mb-1 block text-[13px] font-semibold text-muted">
                    Electricity used this period (kWh)
                  </label>
                  <input
                    id="usage"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="1"
                    value={usageKwh ?? ""}
                    onChange={(e) => setUsageKwh(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="e.g. 420"
                    className="w-full rounded-md border border-line bg-surface-alt px-3 py-2.5 text-[15px] font-medium text-ink outline-none focus:border-primary focus:bg-surface"
                  />
                </div>

                <div className="border-t border-line pt-4">
                  <label htmlFor="cost" className="mb-1 block text-[13px] font-semibold text-muted">
                    Total amount charged this period ($) — optional
                  </label>
                  <input
                    id="cost"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={totalCostDollars ?? ""}
                    onChange={(e) => setTotalCostDollars(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="e.g. 140.50"
                    className="w-full rounded-md border border-line bg-surface-alt px-3 py-2.5 text-[15px] font-medium text-ink outline-none focus:border-primary focus:bg-surface"
                  />
                  <p className="text-small mt-1 text-muted">
                    If you tell us this, we&apos;ll use your real per-kWh rate instead of a regional
                    estimate.
                  </p>
                </div>
              </div>
            </div>

            {stage === "review" && (
              <button
                type="button"
                onClick={() => setStage("idle")}
                className="mt-4 text-small font-semibold text-primary underline underline-offset-2"
              >
                Upload a different file
              </button>
            )}
          </div>
        )}
      </div>

      {(stage === "review" || stage === "manual") && (
        <BottomCTA>
          <Button fullWidth disabled={!canConfirm} onClick={confirmDetails}>
            Confirm details
          </Button>
        </BottomCTA>
      )}
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
  onChange: (v: string) => void;
}) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[13px] font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line bg-surface-alt px-3 py-2.5 text-right text-[15px] font-medium text-ink outline-none focus:border-primary focus:bg-surface"
      />
    </div>
  );
}
