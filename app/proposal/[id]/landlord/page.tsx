"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Download, Loader2, TrendingUp, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import type { BackendProposal } from "@/lib/backend/types";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

export default function LandlordProposalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [proposal, setProposal] = useState<BackendProposal | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetch(`/api/proposals/${encodeURIComponent(params.id)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? "Could not load proposal");
        setProposal(payload as BackendProposal);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load proposal"));
  }, [params.id]);

  async function accept() {
    if (!name || !email) return;
    setAccepting(true);
    const response = await fetch(`/api/proposals/${encodeURIComponent(params.id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landlordName: name, landlordEmail: email }),
    });
    const payload = await response.json();
    setAccepting(false);
    if (!response.ok) {
      setError(payload.message ?? "Could not accept proposal");
      return;
    }
    setProposal(payload as BackendProposal);
  }

  if (error && !proposal) return <div className="flex min-h-[60vh] items-center justify-center text-body text-error">{error}</div>;
  if (!proposal) return <div className="flex min-h-[60vh] items-center justify-center gap-2 text-body text-muted"><Loader2 size={18} className="animate-spin" /> Loading proposal…</div>;

  const summary = proposal.financialSummary;
  const netInvestment = Number(summary.netInstallationCostDollars ?? 0);
  const annualCashflow = Number(summary.estimatedAnnualLandlordCashflow ?? 0);
  const payback = summary.medianPaybackYears == null ? null : Number(summary.medianPaybackYears);
  const tenantSavings = Number(summary.estimatedAnnualTenantSavings ?? 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col pb-8">
      <p className="text-small font-medium text-primary">Proposal from {proposal.tenant.name}</p>
      <h1 className="text-h1 mt-2">A solar investment for {String(proposal.property.name ?? proposal.title)}</h1>

      <Card className="mt-5" accent="primary">
        <div className="flex items-center gap-2 text-primary"><TrendingUp size={17} /><p className="text-[13px] font-semibold uppercase">Saved ROI assessment</p></div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Stat label="Net investment" value={money.format(netInvestment)} />
          <Stat label="Median annual cash flow" value={money.format(annualCashflow)} />
          <Stat label="Median payback" value={payback ? `${payback.toFixed(1)} years` : "Not reached"} />
          <Stat label="Median tenant saving" value={money.format(tenantSavings)} />
        </div>
      </Card>

      <Callout className="mt-4" variant="info" heading="How the rate works">
        The live tenant solar rate is calculated from actual hourly usage. This proposal uses the saved assumption-based approximation and does not guarantee a particular payback date.
      </Callout>

      <Button
        href={`/api/proposal/${encodeURIComponent(proposal.inviteToken)}/pdf`}
        variant="secondary"
        fullWidth
        className="mt-4"
      >
        <Download size={16} /> Download proposal PDF
      </Button>

      {proposal.status === "accepted" ? (
        <Card accent="success" className="mt-6 flex flex-col items-center gap-3 bg-success-light text-center">
          <Check size={26} className="text-success" />
          <p className="font-semibold">Proposal accepted</p>
          <p className="text-small text-muted">The tenant can now continue to final terms and installation confirmation.</p>
          <Button fullWidth onClick={() => router.push("/dashboard")}>Go to dashboard</Button>
        </Card>
      ) : (
        <Card className="mt-6">
          <h2 className="text-h3">Accept as landlord</h2>
          <label className="mt-4 block text-[14px] font-semibold">Full name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-md border border-line px-3 py-2.5 font-normal" /></label>
          <label className="mt-3 block text-[14px] font-semibold">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-md border border-line px-3 py-2.5 font-normal" /></label>
          {error && <p className="mt-3 text-small text-error">{error}</p>}
          <Button variant="landlord" fullWidth className="mt-4" disabled={!name || !email || accepting} onClick={accept}><Check size={16} />{accepting ? "Accepting…" : "Accept proposal"}</Button>
          <Button variant="danger" fullWidth className="mt-3" onClick={() => router.push("/")}><X size={16} /> Decline for now</Button>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div><p className="text-small text-muted">{label}</p><p className="mt-1 text-[18px] font-bold text-ink">{value}</p></div>; }
