"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Loader2, Mail, Repeat } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { BackendProposal, InitialAssessment } from "@/lib/backend/types";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const guarantees = [
  "The tenant solar rate remains below the applicable grid rate.",
  "The landlord receives actual tenant solar revenue plus feed-in tariff revenue.",
  "Charges stop under the agreed terms once the installation balance is recovered.",
  "The tenant can leave without inheriting the property’s remaining system balance.",
];

export default function ProposalPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<InitialAssessment | null>(null);
  const [proposal, setProposal] = useState<BackendProposal | null>(null);
  const [email, setEmail] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const id = query.get("assessmentId") ?? window.sessionStorage.getItem("sunshare-latest-assessment-id");
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- assessment selection comes from navigation/session state
      setError("No saved assessment was selected for this proposal.");
      return;
    }
    fetch(`/api/assessments/${encodeURIComponent(id)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? "Could not load assessment");
        setAssessment(payload as InitialAssessment);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load assessment"));
  }, []);

  async function sendProposal() {
    if (!assessment || !email) return;
    setSending(true);
    setError("");
    const response = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId: assessment.id, landlordEmail: email }),
    });
    const payload = await response.json();
    setSending(false);
    if (!response.ok) {
      setError(payload.message ?? "Could not create proposal");
      return;
    }
    setProposal(payload as BackendProposal);
    setSendOpen(false);
  }

  if (error && !assessment) return <StateMessage message={error} action={() => router.push("/roof")} />;
  if (!assessment) return <StateMessage loading message="Loading proposal assessment…" />;

  const landlord = assessment.landlordEconomics;
  const tenant = assessment.tenantEconomics;
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col pb-8">
      {proposal && (
        <div className="flex justify-end">
          <a href={`/proposal/${proposal.inviteToken}/landlord`} className="flex items-center gap-1 rounded-full bg-secondary-light px-3 py-1.5 text-[12px] font-semibold text-secondary">
            <Repeat size={13} /> View as landlord
          </a>
        </div>
      )}

      <div className="mt-4 rounded-t-lg bg-primary px-6 py-6 text-white">
        <p className="text-[12px] font-semibold tracking-wide text-white/70 uppercase">Solar sharing proposal</p>
        <h1 className="text-h1 mt-1 text-white">{assessment.address.formattedAddress}</h1>
        <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-white/80">
          <span>Assessment: {assessment.id.slice(0, 8).toUpperCase()}</span>
          <span>Source: {assessment.forecastSource.replace("_", " ")}</span>
        </div>
      </div>
      <div className="rounded-b-lg border border-t-0 border-line bg-surface-alt px-6 py-3 text-[13px] text-muted">
        Every financial figure below is taken from the saved ROI assessment.
      </div>

      <Section title="System and investment">
        <Card>
          <Row label="System" value={`${assessment.system.systemSizeKw.toFixed(1)} kW · ${assessment.system.panelCount} panels`} />
          <Row label="Expected annual generation" value={`${Math.round(assessment.system.expectedAnnualGenerationKwh).toLocaleString()} kWh`} />
          <Row label="Net landlord investment" value={money.format(landlord.netInstallationCostDollars)} />
          <Row label="Installation cost source" value={assessment.installationCostSource === "provided" ? "Provided quote" : "Model estimate — confirmation required"} />
        </Card>
      </Section>

      <Section title="Tenant and landlord outcome">
        <Card>
          <Row label="Median annual tenant saving" value={money.format(tenant.annualSavingsDollars.median)} />
          <Row label="Median first-year landlord cash flow" value={money.format(landlord.firstYearNetCashflowDollars.median)} />
          <Row label="Median payback" value={landlord.medianPaybackYears ? `${landlord.medianPaybackYears.toFixed(1)} years` : "Not reached"} />
          <Row label="90% simulation range" value={`${landlord.paybackRangeYears.lower?.toFixed(1) ?? "—"}–${landlord.paybackRangeYears.upper?.toFixed(1) ?? "—"} years`} />
        </Card>
        <Card className="mt-3">
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={assessment.monteCarlo.payback_cdf} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                <XAxis dataKey="years" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="probability" stroke="#00A76F" fill="#D5F5E8" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-small text-muted">Cumulative probability of payback under the saved assumptions.</p>
        </Card>
      </Section>

      <Section title="Fairness terms">
        <Card><ul className="space-y-2">{guarantees.map((item) => <li key={item} className="flex gap-2 text-[14px]"><Check size={15} className="mt-0.5 shrink-0 text-success" />{item}</li>)}</ul></Card>
      </Section>

      {assessment.warnings.length > 0 && (
        <Card className="mt-6 bg-warning-light/40">
          <p className="text-[13px] font-semibold text-warning">Must be confirmed before acceptance</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-small">{assessment.warnings.map((warning) => <li key={warning.code}>{warning.message}</li>)}</ul>
        </Card>
      )}

      {error && <p className="mt-4 rounded-lg bg-error-light p-3 text-small text-error">{error}</p>}
      <div className="mt-6 flex flex-col gap-3">
        {!proposal && !sendOpen && <Button fullWidth onClick={() => setSendOpen(true)}><Mail size={16} /> Send to landlord</Button>}
        {sendOpen && (
          <Card>
            <label className="text-[14px] font-semibold">Landlord&apos;s email</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-md border border-line px-3 py-2.5" placeholder="landlord@example.com" />
            <Button fullWidth className="mt-3" disabled={!email || sending} onClick={sendProposal}>{sending ? "Creating proposal…" : "Create shareable proposal"}</Button>
          </Card>
        )}
        {proposal && (
          <Card accent="success" className="flex flex-col items-center gap-3 bg-success-light text-center">
            <Check size={24} className="text-success" />
            <p className="font-semibold">Proposal created from assessment {assessment.id.slice(0, 8)}</p>
            <button onClick={() => navigator.clipboard?.writeText(proposal.inviteUrl)} className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-small"><Copy size={13} /> Copy landlord link</button>
            <Button href={`/api/proposal/${encodeURIComponent(proposal.inviteToken)}/pdf`} fullWidth>
              <Download size={16} /> Download proposal PDF
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mt-7"><h2 className="text-h2 mb-3">{title}</h2>{children}</section>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b border-dashed border-line py-2.5 last:border-0"><span className="text-small text-muted">{label}</span><strong className="text-right text-[14px] text-ink">{value}</strong></div>; }
function StateMessage({ message, loading, action }: { message: string; loading?: boolean; action?: () => void }) { return <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">{loading && <Loader2 className="animate-spin text-primary" />}<p className="text-body text-muted">{message}</p>{action && <Button onClick={action}>Start assessment</Button>}</div>; }
