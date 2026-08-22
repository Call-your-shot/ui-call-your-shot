"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";
import {
  formatAddress,
  formatCurrency,
  formatDate,
  getPlan,
  getScenarioForPlan,
  maintenanceSchedule,
  paybackSchedule,
  fairnessGuarantees,
} from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Copy, Download, Mail, Repeat, Check } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export default function ProposalPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const plan = getPlan(params.id) ?? getPlan("plan-pending")!;
  const scenario = getScenarioForPlan(plan);
  const r = scenario.results!;
  const reference = `SS-${plan.id.replace("plan-", "").toUpperCase()}-${new Date(plan.createdDate).getFullYear()}`;

  const [sendOpen, setSendOpen] = useState(false);
  const [email, setEmail] = useState(plan.landlordName ? "" : "");
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col pb-8">
      <div className="flex justify-end">
        <Link
          href={`/proposal/${plan.id}/landlord`}
          className="flex items-center gap-1 rounded-full bg-secondary-light px-3 py-1.5 text-[12px] font-semibold text-secondary"
        >
          <Repeat size={13} aria-hidden="true" /> View as landlord
        </Link>
      </div>

      {/* Document header band */}
        <div className="mt-4 rounded-t-lg bg-primary px-6 py-6 text-white">
          <p className="text-[12px] font-semibold tracking-wide text-white/70 uppercase">
            Solar sharing proposal
          </p>
          <h1 className="text-h1 mt-1 text-white">{formatAddress(plan.address)}</h1>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-white/80">
            <span>Reference: {reference}</span>
            <span>Date: {formatDate(plan.createdDate)}</span>
            <span>Prepared for: {plan.landlordName}</span>
          </div>
        </div>
        <div className="rounded-b-lg border border-t-0 border-line bg-surface-alt px-6 py-3 text-[13px] text-muted">
          This is what {plan.landlordName} will see when you send it.
        </div>

        <DocSection number={1} title="Property summary">
          <Card>
            <Row label="Address" value={formatAddress(plan.address)} />
            <Row label="Prepared for" value={plan.landlordName} />
            <Row label="Prepared" value={formatDate(plan.createdDate)} />
          </Card>
        </DocSection>

        <DocSection number={2} title="System design">
          <Card className="grid grid-cols-3 gap-2 text-center">
            <MiniStat value={`${scenario.roof.panelCount}`} label="Panels" />
            <MiniStat value={`${scenario.roof.systemSizeKw} kW`} label="System size" />
            <MiniStat value={`${scenario.roof.pitchDegrees}°`} label="Pitch" />
          </Card>
        </DocSection>

        <DocSection number={3} title="Investment breakdown">
          <Card>
            <Row label="System cost" value={formatCurrency(r.systemCost)} />
            <Row label="Federal STC solar rebate" value={`− ${formatCurrency(r.federalRebate)}`} />
            <Row label="Net landlord investment" value={formatCurrency(r.netLandlordInvestment)} bold />
            <Row label="20-year maintenance reserve" value={formatCurrency(r.maintenanceReserve20yr)} />
          </Card>
        </DocSection>

        <DocSection number={4} title="Return on investment">
          <Card>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold tabular-nums text-ink">
                {r.landlordReturnPercent}%
              </p>
              <p className="text-[12px] font-medium text-muted">per annum, once repaid</p>
            </div>
            <div className="mt-3 h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paybackSchedule} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <XAxis
                    dataKey="year"
                    tickFormatter={(y) => `Y${y}`}
                    tick={{ fontSize: 11, fill: "#637381" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v < 0 ? "-" : ""}$${Math.round(Math.abs(v) / 1000)}k`}
                    tick={{ fontSize: 11, fill: "#637381" }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <ReferenceLine y={0} stroke="#DFE3E8" />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#00A76F"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#00A76F" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[12px] text-muted">
              Landlord position over time — crosses breakeven around year 7.
            </p>
          </Card>
        </DocSection>

        <DocSection number={5} title="Maintenance schedule (20 years)">
          <Card className="max-h-64 overflow-y-auto">
            <div className="flex flex-col">
              {maintenanceSchedule.map((m) => (
                <div
                  key={m.year}
                  className="flex items-center justify-between border-b border-line py-2.5 last:border-0"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-ink">Year {m.year}</p>
                    <p className="text-[12px] text-muted">{m.description}</p>
                  </div>
                  <span className="text-[13px] font-medium tabular-nums text-ink">
                    {formatCurrency(m.costDollars)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </DocSection>

        <DocSection number={6} title="Tenant agreement terms">
          <Card>
            <ul className="flex flex-col gap-2.5">
              {fairnessGuarantees.map((g) => (
                <li key={g} className="flex items-start gap-2 text-[14px] text-ink">
                  <Check size={15} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                  {g}
                </li>
              ))}
            </ul>
          </Card>
        </DocSection>

        <DocSection number={7} title="Legal note">
          <Card className="bg-surface-alt">
            <p className="text-[13px] leading-relaxed text-muted">
              This arrangement is structured to fall within the Australian
              Energy Regulator&apos;s embedded network exemption for
              small-scale, single-premises solar sharing agreements. It is not
              a retail electricity sale and does not require a retailer
              authorisation. SunShare provides this document for
              informational purposes and recommends independent legal advice
              before signing.
            </p>
          </Card>
        </DocSection>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => window.open(`/api/proposal/${plan.id}/pdf`, "_blank")}
          >
            <Download size={16} aria-hidden="true" />
            Download PDF
          </Button>

          {!sendOpen && !sent && (
            <Button fullWidth onClick={() => setSendOpen(true)}>
              <Mail size={16} aria-hidden="true" />
              Send to landlord
            </Button>
          )}

          {sendOpen && !sent && (
            <Card className="animate-fade-up">
              <label htmlFor="landlord-email" className="mb-2 block text-[14px] font-semibold text-ink">
                Landlord&apos;s email
              </label>
              <input
                id="landlord-email"
                type="email"
                inputMode="email"
                placeholder="landlord@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-line bg-surface-alt px-3 py-2.5 text-[15px] text-ink outline-none focus:border-primary focus:bg-surface"
              />
              <Button fullWidth className="mt-3" disabled={!email} onClick={() => setSent(true)}>
                Send proposal
              </Button>
            </Card>
          )}

          {sent && (
            <Card
              accent="success"
              className="flex flex-col items-center gap-3 bg-success-light text-center animate-fade-up"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-white">
                <Check size={22} aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-ink">Proposal sent</p>
                <p className="text-small mt-1 text-muted">
                  We emailed {email || plan.landlordName} a link to review and
                  respond.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(`https://sunshare.app/p/${plan.id}`)}
                className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-2 text-[12px] font-medium text-ink"
              >
                <Copy size={13} aria-hidden="true" /> Copy shareable link
              </button>
              <Button fullWidth onClick={() => router.push("/dashboard")}>
                Back to dashboard
              </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

function DocSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-h3 mb-2 flex items-baseline gap-2 text-ink">
        <span className="text-muted">{number}.</span> {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="shrink-0 pt-px text-[13px] text-muted">{label}</span>
      <span
        className={cn(
          "text-right tabular-nums",
          bold ? "text-[14px] font-bold text-ink" : "text-[14px] font-medium text-ink"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-bold tabular-nums text-ink">{value}</p>
      <p className="text-[11px] font-medium text-muted">{label}</p>
    </div>
  );
}
