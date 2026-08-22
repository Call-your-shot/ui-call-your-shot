"use client";

import BottomCTA from "@/components/ui/BottomCTA";
import Button from "@/components/ui/Button";
import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import { useDemo } from "@/lib/demo-context";
import { formatCurrency, scenarios, confidenceFan } from "@/lib/mockData";
import { useCountUp } from "@/lib/useCountUp";
import { cn } from "@/lib/utils";
import { ChevronDown, CloudSun, Frown, Home, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

export default function ResultsPage() {
  const { scenario, forceRefusal } = useDemo();
  const property = scenarios[scenario];
  const showRefusal = forceRefusal || !property.works;

  return (
    <div className="flex min-h-dvh flex-col">
      {showRefusal ? <RefusalView /> : <ResultsView />}
    </div>
  );
}

function ResultsView() {
  const router = useRouter();
  const r = scenarios.bellambi.results!;
  const [detailOpen, setDetailOpen] = useState(false);
  const animatedSavings = useCountUp(r.annualSavings);

  return (
    <div className="flex w-full flex-1 flex-col pt-4 pb-8">
      <div className="mt-3 animate-fade-up">
        <h1 className="text-body font-semibold text-muted">You could save</h1>
        <p className="text-data mt-1 text-success">
          {formatCurrency(Math.round(animatedSavings))}
        </p>
        <p className="text-body text-muted">a year.</p>
      </div>

      {/* Comparison bars */}
      <Card className="mt-6 animate-fade-up [animation-delay:60ms]">
        <p className="text-[13px] font-semibold tracking-wide text-muted uppercase">
          Now vs. with SunShare
        </p>
        <div className="mt-3">
          <ComparisonRow
            label="Now"
            value={r.currentAnnualBill}
            max={r.currentAnnualBill}
            colorClass="bg-primary"
          />
          <ComparisonRow
            label="With SunShare"
            value={r.withSunShareAnnualBill}
            max={r.currentAnnualBill}
            colorClass="bg-secondary"
            className="mt-3"
          />
        </div>
      </Card>

      {/* Donut chart */}
      <Card className="mt-4 animate-fade-up [animation-delay:100ms]">
        <p className="text-[13px] font-semibold tracking-wide text-muted uppercase">
          Where your power comes from
        </p>
        <div className="relative flex items-center justify-center py-4">
          <div
            className="relative h-44 w-44 rounded-full"
            style={{
              background: `conic-gradient(#00A76F 0deg ${r.solarSharePercent * 3.6}deg, #DFE3E8 ${r.solarSharePercent * 3.6}deg 360deg)`,
              transition: "background 0.6s ease-out",
            }}
          >
            <div className="absolute inset-[34px] flex flex-col items-center justify-center rounded-full bg-surface">
              <span className="text-2xl font-bold tabular-nums text-ink">
                {r.solarSharePercent}%
              </span>
              <span className="text-[11px] font-medium text-muted">solar</span>
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-center gap-5">
          <Legend color="bg-primary" label={`Solar ${r.solarSharePercent}%`} />
          <Legend color="bg-line" label={`Grid ${r.gridSharePercent}%`} />
        </div>
      </Card>

      {/* The deal */}
      <div className="mt-4 animate-fade-up [animation-delay:140ms]">
        <Callout variant="success" heading="The deal">
          <div className="flex flex-col gap-2.5">
            <p>
              You pay <span className="font-bold text-ink">{r.solarRateCents}¢</span>{" "}
              per unit for solar (vs{" "}
              <span className="font-bold text-ink">{r.gridRateCents}¢</span> from the
              grid)
            </p>
            <p>
              Your landlord earns{" "}
              <span className="font-bold text-ink">{r.landlordSunShareRateCents}¢</span>{" "}
              instead of{" "}
              <span className="font-bold text-ink">{r.landlordExportRateCents}¢</span>{" "}
              from exporting
            </p>
            <p>
              Charge ends once the system is paid off: estimated{" "}
              <span className="font-bold text-ink">{r.payoffYear}</span>
            </p>
          </div>
        </Callout>
      </div>

      {/* System & cost collapsible */}
      <button
        type="button"
        onClick={() => setDetailOpen((o) => !o)}
        aria-expanded={detailOpen}
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-line bg-surface px-4 py-3.5 hover:bg-surface-alt"
      >
        <span className="text-[14px] font-semibold text-primary">System &amp; cost</span>
        <ChevronDown
          size={16}
          className={cn("text-primary transition-transform", detailOpen && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {detailOpen && (
        <Card className="mt-2 animate-fade-up">
          <DetailRow label="System cost" value={formatCurrency(r.systemCost)} />
          <DetailRow label="Federal battery rebate" value={`− ${formatCurrency(r.federalRebate)}`} accent="success" />
          <DetailRow label="Net landlord investment" value={formatCurrency(r.netLandlordInvestment)} bold />
          <DetailRow label="20-year maintenance reserve" value={formatCurrency(r.maintenanceReserve20yr)} />
          <DetailRow label="Landlord return" value={`${r.landlordReturnPercent}% p.a.`} bold />
        </Card>
      )}

      {/* Confidence fan chart */}
      <Card className="mt-4 animate-fade-up [animation-delay:180ms]">
        <p className="text-[13px] font-semibold tracking-wide text-muted uppercase">Confidence</p>
        <div className="mt-2 h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={confidenceFan} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="fan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00A76F" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00A76F" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="high" stroke="none" fill="url(#fan)" stackId="range" />
              <Area type="monotone" dataKey="low" stroke="none" fill="#FFFFFF" stackId="range" />
              <Area type="monotone" dataKey="median" stroke="#00A76F" strokeWidth={2} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-small mt-2 font-medium text-ink">
          In <span className="font-bold text-secondary">{r.confidencePercent}%</span> of
          modelled futures, you save money.
        </p>
      </Card>

      <div className="h-4" />

      <BottomCTA>
        <Button fullWidth onClick={() => router.push("/proposal/plan-pending")}>
          Generate landlord proposal
        </Button>
      </BottomCTA>
    </div>
  );
}

function RefusalView() {
  const router = useRouter();
  const reasons = scenarios.shaded.refusalReasons!;

  return (
    <div className="flex w-full flex-1 flex-col pt-4 pb-8">
      <div className="mt-6 flex flex-col items-center text-center animate-fade-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-line">
          <Frown size={28} className="text-muted" aria-hidden="true" />
        </div>
        <h1 className="text-h1 mt-5 text-primary">
          We can&apos;t offer a fair deal here.
        </h1>
        <p className="text-body mt-3 text-muted">
          This roof faces south and is shaded for most of the afternoon. The
          system would generate too little for both you and your landlord to
          benefit. We won&apos;t recommend a deal that doesn&apos;t work.
        </p>
      </div>

      <Card className="mt-6 animate-fade-up [animation-delay:80ms]">
        <p className="text-[13px] font-semibold tracking-wide text-muted uppercase">
          Why this doesn&apos;t work
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {reasons.map((reason) => (
            <div
              key={reason.metric}
              className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-[14px] font-medium text-ink">{reason.metric}</p>
                <p className="text-[12px] text-muted">{reason.threshold}</p>
              </div>
              <span className="shrink-0 text-right text-[14px] font-semibold text-ink">
                {reason.value}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <p className="mt-6 mb-3 text-[13px] font-semibold tracking-wide text-muted uppercase">
        What you could try instead
      </p>
      <div className="flex flex-col gap-3">
        <Card className="flex items-start gap-3 animate-fade-up [animation-delay:120ms]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent">
            <Zap size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-ink">Efficiency measures</p>
            <p className="text-small mt-0.5 text-muted">
              Small changes — LED lighting, draught sealing, hot water timers —
              can cut your bill 10–15% with no roof involved.
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-3 animate-fade-up [animation-delay:160ms]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-light text-secondary">
            <CloudSun size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-ink">Community battery waitlist</p>
            <p className="text-small mt-0.5 text-muted">
              Join the waitlist for a shared community battery nearby — get
              solar-backed rates without needing your own roof.
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-3 animate-fade-up [animation-delay:200ms]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-muted">
            <Home size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-ink">Check another property</p>
            <p className="text-small mt-0.5 text-muted">
              Moving soon? Run the numbers on a different address to see if it
              qualifies.
            </p>
          </div>
        </Card>
      </div>

      <BottomCTA>
        <Button variant="secondary" fullWidth onClick={() => router.push("/dashboard")}>
          Back to dashboard
        </Button>
      </BottomCTA>
    </div>
  );
}

function ComparisonRow({
  label,
  value,
  max,
  colorClass,
  className,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
  className?: string;
}) {
  const pct = Math.max(6, Math.round((value / max) * 100));
  return (
    <div className={className}>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        <span className="text-[15px] font-bold tabular-nums text-ink">
          {formatCurrency(value)}
          <span className="text-[12px] font-normal text-muted">/yr</span>
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div
          className={cn("h-full rounded-full transition-all duration-700", colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
      <span className="text-[12px] font-medium text-muted">{label}</span>
    </div>
  );
}

function DetailRow({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: "success";
}) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2.5 last:border-0">
      <span className="text-[13px] text-muted">{label}</span>
      <span
        className={cn(
          "text-[14px] tabular-nums",
          bold ? "font-bold text-ink" : "font-medium text-ink",
          accent === "success" && "text-success"
        )}
      >
        {value}
      </span>
    </div>
  );
}
