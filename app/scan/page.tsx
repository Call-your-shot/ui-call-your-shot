"use client";

import BottomCTA from "@/components/ui/BottomCTA";
import Button from "@/components/ui/Button";
import { lastMonthRange, loadBillFlow, resetBillFlow, saveBillFlow } from "@/lib/billFlow";
import type { AddressApiResponse } from "@/app/api/address/route";
import type { BillApiResponse } from "@/lib/bill/types";
import { AlertTriangle, Camera, FileText, Loader2, MapPin, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Stage = "idle" | "scanning" | "review" | "manual" | "error";
type AddressStatus = "idle" | "checking" | "valid" | "invalid";

const scanSteps = ["Reading bill...", "Identifying address...", "Extracting usage..."];

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
    const isNewAssessment = new URLSearchParams(window.location.search).get("new") === "1";
    if (isNewAssessment) {
      resetBillFlow();
      window.history.replaceState(window.history.state, "", "/scan");
    }
  }, []);

  useEffect(() => {
    if (stage !== "scanning") return;
    const interval = setInterval(() => {
      setStepIndex((index) => Math.min(index + 1, scanSteps.length - 1));
    }, 700);
    return () => clearInterval(interval);
  }, [stage]);

  useEffect(() => {
    if (stage !== "review" && stage !== "manual") return;
    if (!address.trim()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- debounced address verification starts here
    setAddressStatus("checking");
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch("/api/address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
        const payload = (await response.json()) as AddressApiResponse;
        if (payload.ok && payload.formattedAddress) {
          setAddressStatus("valid");
          setAddressMessage(payload.formattedAddress);
        } else {
          setAddressStatus("invalid");
          setAddressMessage(payload.message ?? "We could not find that address");
        }
      } catch {
        setAddressStatus("valid");
        setAddressMessage(address.trim());
      }
    }, 600);
    return () => clearTimeout(timeout);
  }, [address, stage]);

  function startManual() {
    const range = lastMonthRange();
    setBillingPeriodStart(range.start);
    setBillingPeriodEnd(range.end);
    setUsageKwh(null);
    setTotalCostDollars(null);
    setRetailer("");
    setAddress("");
    setAddressMessage("");
    setAddressStatus("idle");
    setStage("manual");
  }

  async function handleFile(file: File) {
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("That file is too large. Try a smaller photo or PDF.");
      setStage("error");
      return;
    }
    setStage("scanning");
    setStepIndex(0);
    setErrorMessage("");

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
      const payload = (await response.json()) as BillApiResponse;
      if (!payload.ok) {
        setErrorMessage(payload.message);
        setStage("error");
        return;
      }

      setAddress(payload.result.address);
      setBillingPeriodStart(payload.result.billingPeriodStart);
      setBillingPeriodEnd(payload.result.billingPeriodEnd);
      setUsageKwh(payload.result.usageKwh || null);
      setTotalCostDollars(payload.result.totalCostDollars || null);
      setRetailer(payload.result.retailer);
      setStage("review");
    } catch {
      setErrorMessage("Something went wrong reading that file. Try again or enter details manually.");
      setStage("error");
    }
  }

  const displayedAddressStatus: AddressStatus = address.trim() ? addressStatus : "idle";
  const canConfirm =
    (stage === "review" || stage === "manual") &&
    displayedAddressStatus === "valid" &&
    !!usageKwh &&
    usageKwh > 0 &&
    !!billingPeriodStart &&
    !!billingPeriodEnd &&
    billingPeriodEnd > billingPeriodStart;

  function confirmDetails() {
    saveBillFlow({
      ...loadBillFlow(),
      address: displayedAddressStatus === "valid" ? addressMessage : address.trim(),
      billingPeriodStart,
      billingPeriodEnd,
      usageKwh,
      billTotalCostDollars: totalCostDollars,
    });
    router.push("/household");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex w-full flex-1 flex-col pt-4 pb-8">
        <h1 className="text-h1 text-ink">Scan your bill</h1>

        {stage === "idle" && (
          <div className="flex flex-1 flex-col">
            <p className="text-body mt-1 text-muted">
              Upload a photo or PDF of a recent electricity bill, or enter the details manually.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 flex min-h-64 flex-1 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-primary-light/50 bg-surface-alt px-6 py-10 text-center hover:border-primary hover:bg-secondary-light/30"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
                <Camera size={26} aria-hidden="true" />
              </span>
              <span className="text-h3 text-ink">Take a photo or upload</span>
              <span className="text-small text-muted">JPG, PNG, or PDF</span>
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
              {scanSteps.map((scanStep, index) => (
                <p
                  key={scanStep}
                  className={
                    index === stepIndex
                      ? "text-[15px] font-semibold text-ink"
                      : index < stepIndex
                        ? "text-small text-success"
                        : "text-small text-muted"
                  }
                >
                  {scanStep}
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
              <h2 className="text-h3 text-ink">Could not read that bill</h2>
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
              {stage === "review" ? "Check what we found and fix anything off." : "Enter the details from a recent bill."}
            </p>
            <div className="mt-5 overflow-hidden rounded-lg border border-line bg-surface">
              <div className="flex items-center justify-between bg-primary px-5 py-4 text-white">
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-white/80 uppercase">
                    {stage === "review" ? "Electricity bill" : "Manual entry"}
                  </p>
                  <p className="text-h3 mt-0.5 text-white">{retailer || "Your bill"}</p>
                </div>
                <FileText size={26} className="opacity-70" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-4 p-5">
                <div>
                  <label htmlFor="bill-address" className="mb-1 block text-[13px] font-semibold text-muted">
                    Address
                  </label>
                  <input
                    id="bill-address"
                    type="text"
                    value={address}
                    onChange={(event) => {
                      setAddress(event.target.value);
                      setAddressStatus("idle");
                      setAddressMessage("");
                    }}
                    placeholder="e.g. 12 Example Street, Wollongong NSW 2500"
                    className="w-full rounded-md border border-line bg-surface-alt px-3 py-2.5 text-[15px] font-medium text-ink outline-none focus:border-primary focus:bg-surface"
                  />
                  <div className="mt-1.5 flex min-h-4 items-center gap-1.5 text-[12px]">
                    {displayedAddressStatus === "checking" && (
                      <>
                        <Loader2 size={12} className="animate-spin text-muted" aria-hidden="true" />
                        <span className="text-muted">Checking address...</span>
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
                  <p className="text-[12px] font-semibold tracking-wide text-muted uppercase">Billing period</p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <DateField label="Period start" value={billingPeriodStart} onChange={setBillingPeriodStart} />
                    <DateField label="Period end" value={billingPeriodEnd} onChange={setBillingPeriodEnd} />
                  </div>
                </div>
                <NumberField
                  id="bill-usage"
                  label="Electricity used this period (kWh)"
                  value={usageKwh}
                  min={0}
                  step="1"
                  placeholder="e.g. 420"
                  onChange={setUsageKwh}
                />
                <NumberField
                  id="bill-cost"
                  label="Total amount charged this period ($)"
                  optional
                  value={totalCostDollars}
                  min={0}
                  step="0.01"
                  placeholder="e.g. 140.50"
                  onChange={setTotalCostDollars}
                />
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

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
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
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-line bg-surface-alt px-3 py-2.5 text-right text-[15px] font-medium text-ink outline-none focus:border-primary focus:bg-surface"
      />
    </div>
  );
}

function NumberField({
  id,
  label,
  optional,
  value,
  min,
  step,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  optional?: boolean;
  value: number | null;
  min: number;
  step: string;
  placeholder: string;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="border-t border-line pt-4">
      <label htmlFor={id} className="mb-1 block text-[13px] font-semibold text-muted">
        {label} {optional && <span className="font-normal">- optional</span>}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value ? parseFloat(event.target.value) : null)}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-surface-alt px-3 py-2.5 text-[15px] font-medium text-ink outline-none focus:border-primary focus:bg-surface"
      />
    </div>
  );
}
