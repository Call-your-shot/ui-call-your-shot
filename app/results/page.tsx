"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ChevronDown, Loader2 } from "lucide-react";
import BottomCTA from "@/components/ui/BottomCTA";
import Button from "@/components/ui/Button";
import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import type { InitialAssessment } from "@/lib/backend/types";
import { cn } from "@/lib/utils";
import { NEW_ASSESSMENT_HREF } from "@/lib/billFlow";

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

export default function ResultsPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<InitialAssessment | null>(null);
  const [error, setError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("assessmentId") ?? window.sessionStorage.getItem("sunshare-latest-assessment-id");
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URL/session state is external to React
      setError("No completed assessment was selected. Start a new assessment from your dashboard.");
      return;
    }
    fetch(`/api/assessments/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? "Could not load assessment");
        setAssessment(payload as InitialAssessment);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load assessment"));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle size={34} className="text-warning" />
        <h1 className="text-h2 text-ink">Assessment unavailable</h1>
        <p className="text-body max-w-md text-muted">{error}</p>
        <Button onClick={() => router.push(NEW_ASSESSMENT_HREF)}>Start a new assessment</Button>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-2 text-body text-muted">
        <Loader2 size={18} className="animate-spin" /> Loading your ROI assessment…
      </div>
    );
  }

  const tenant = assessment.tenantEconomics;
  const landlord = assessment.landlordEconomics;
  const savings = tenant.annualSavingsDollars.median;
  const projectedBill = tenant.projectedAnnualElectricityCostDollars.median;
  const solarShare = Math.round(tenant.solarShareRatio.median * 100);
  const payback = landlord.medianPaybackYears;
  const range = landlord.paybackRangeYears;
  const payoffYear = payback ? new Date().getFullYear() + Math.ceil(payback) : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex w-full flex-1 flex-col pt-4 pb-28">
        {assessment.recommendation !== "viable" && (
          <Callout
            variant={assessment.recommendation === "not_recommended" ? "warning" : "info"}
            heading={assessment.recommendation === "not_recommended" ? "This deal needs work" : "Confirm these estimates"}
          >
            {assessment.recommendation === "not_recommended"
              ? "Under the current assumptions, tenant savings or landlord payback are not strong enough for an automatic recommendation."
              : assessment.reviewReasons.join(" ")}
          </Callout>
        )}

        <div className="mt-4 animate-fade-up">
          <p className="text-body font-semibold text-muted">Median modelled tenant saving</p>
          <h1 className={cn("text-data mt-1", savings >= 0 ? "text-success" : "text-error")}>
            {money.format(savings)}
          </h1>
          <p className="text-body text-muted">per year</p>
          <p className="text-small mt-1 text-muted">
            P05–P95 range: {money.format(tenant.annualSavingsDollars.p05)} to {money.format(tenant.annualSavingsDollars.p95)}
          </p>
        </div>

        <Card className="mt-6">
          <p className="text-[13px] font-semibold tracking-wide text-muted uppercase">Now vs. with SunShare</p>
          <ComparisonRow label="Grid-only baseline" value={tenant.baselineAnnualBillDollars} max={tenant.baselineAnnualBillDollars} color="bg-primary" />
          <ComparisonRow label="Modelled with SunShare" value={projectedBill} max={tenant.baselineAnnualBillDollars} color="bg-secondary" />
        </Card>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-[13px] font-semibold tracking-wide text-muted uppercase">Tenant energy</p>
            <div className="mt-4 flex items-center gap-5">
              <div className="relative h-28 w-28 shrink-0 rounded-full" style={{ background: `conic-gradient(#00A76F 0deg ${solarShare * 3.6}deg, #DFE3E8 ${solarShare * 3.6}deg 360deg)` }}>
                <div className="absolute inset-6 flex items-center justify-center rounded-full bg-surface text-lg font-bold text-ink">{solarShare}%</div>
              </div>
              <div>
                <p className="text-body font-semibold text-ink">of demand supplied by solar</p>
                <p className="text-small mt-1 text-muted">This is different from the share of generation exported.</p>
              </div>
            </div>
          </Card>
          <Card>
            <p className="text-[13px] font-semibold tracking-wide text-muted uppercase">Modelled solar rate</p>
            <p className="text-data mt-3 text-primary">{assessment.pricing.tenantSolarRateCentsPerKwh.median.toFixed(1)}¢</p>
            <p className="text-small mt-1 text-muted">vs. {assessment.pricing.gridRateCentsPerKwh.toFixed(1)}¢ grid and {assessment.pricing.exportRateCentsPerKwh.toFixed(1)}¢ export</p>
            <p className="text-small mt-3 text-muted">Initial assessments approximate the hourly pricing function. Live bills use actual intervals.</p>
          </Card>
        </div>

        <Callout variant="success" heading="Landlord payback" className="mt-4">
          {payback ? (
            <p>
              Median payback is <strong>{payback.toFixed(1)} years</strong> (around {payoffYear}), with a 90% simulation range of <strong>{range.lower?.toFixed(1)}–{range.upper?.toFixed(1)} years</strong>.
            </p>
          ) : (
            <p>Payback was not reached often enough within the selected forecast horizon.</p>
          )}
        </Callout>

        <button type="button" onClick={() => setDetailOpen((open) => !open)} aria-expanded={detailOpen} className="mt-4 flex w-full items-center justify-between rounded-lg border border-line bg-surface px-4 py-3.5 hover:bg-surface-alt">
          <span className="text-[14px] font-semibold text-primary">System, cost &amp; assumptions</span>
          <ChevronDown size={16} className={cn("text-primary transition-transform", detailOpen && "rotate-180")} />
        </button>
        {detailOpen && (
          <Card className="mt-2">
            <DetailRow label="System" value={`${assessment.system.systemSizeKw.toFixed(1)} kW · ${assessment.system.panelCount} panels`} />
            <DetailRow label="Expected generation" value={`${Math.round(assessment.system.expectedAnnualGenerationKwh).toLocaleString()} kWh/year`} />
            <DetailRow label="Net landlord investment" value={money.format(landlord.netInstallationCostDollars)} />
            <DetailRow label="First-year landlord cash flow" value={money.format(landlord.firstYearNetCashflowDollars.median)} />
            <DetailRow label="Simple annual yield" value={landlord.simpleAnnualYieldPercentage ? `${landlord.simpleAnnualYieldPercentage.median.toFixed(1)}%` : "Unavailable"} />
            <DetailRow label="Cost source" value={assessment.installationCostSource === "provided" ? "Provided quote" : "Model default — update before proposal"} />
          </Card>
        )}

        <Card className="mt-4">
          <p className="text-[13px] font-semibold tracking-wide text-muted uppercase">Payback probability</p>
          <div className="mt-3 h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={assessment.monteCarlo.payback_cdf} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DFE3E8" />
                <XAxis dataKey="years" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `${Math.round(Number(value) * 100)}%`} />
                <Area type="monotone" dataKey="probability" stroke="#00A76F" fill="#D5F5E8" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-small mt-2 text-muted">
            {Math.round(landlord.probabilityPaybackWithin7Years * 100)}% pay back within 7 years; {Math.round(landlord.probabilityPaybackWithin10Years * 100)}% within 10 years.
          </p>
          <p className="text-small mt-1 text-muted">
            {Math.round(tenant.probabilitySavesMoney * 100)}% of simulated first years produce tenant savings.
          </p>
        </Card>

        {assessment.warnings.length > 0 && (
          <Card className="mt-4 border-warning/30 bg-warning-light/40">
            <p className="text-[13px] font-semibold text-warning">Assumptions to confirm</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-small text-grey-700">
              {assessment.warnings.map((warning) => <li key={warning.code}>{warning.message}</li>)}
            </ul>
          </Card>
        )}
      </div>

      <BottomCTA>
        <Button fullWidth onClick={() => router.push(`/proposal/plan-pending?assessmentId=${encodeURIComponent(assessment.id)}`)}>
          Generate landlord proposal
        </Button>
      </BottomCTA>
    </div>
  );
}

function ComparisonRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-small"><span>{label}</span><strong className="text-ink">{money.format(value)}</strong></div>
      <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-surface-sunken"><div className={cn("h-full rounded-full", color)} style={{ width: `${Math.max(2, Math.min(100, max > 0 ? value / max * 100 : 0))}%` }} /></div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-dashed border-line py-2.5 last:border-0"><span className="text-small text-muted">{label}</span><span className="text-[14px] font-semibold text-right text-ink">{value}</span></div>;
}
