"use client";

import Button from "@/components/ui/Button";
import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import Link from "next/link";
import {
  formatAddress,
  formatCurrency,
  formatDate,
  getPlan,
  getScenarioForPlan,
  paybackSchedule,
  rebateStepDownDate,
  rebateStepDownSavings,
} from "@/lib/mockData";
import { Home, Repeat, TrendingUp, X, Check, MessageSquare } from "lucide-react";
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

type Decision = "none" | "accepted" | "changes" | "declined";

export default function LandlordProposalPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const plan = getPlan(params.id) ?? getPlan("plan-pending")!;
  const scenario = getScenarioForPlan(plan);
  const r = scenario.results!;

  const [decision, setDecision] = useState<Decision>("none");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col pb-8">
      <div className="flex justify-end">
        <Link
          href={`/proposal/${plan.id}`}
          className="flex items-center gap-1 rounded-full bg-secondary-light px-3 py-1.5 text-[12px] font-semibold text-secondary"
        >
          <Repeat size={13} aria-hidden="true" /> View as tenant
        </Link>
      </div>

      <p className="text-small mt-3 font-medium text-primary">
          Proposal from your tenant at {formatAddress(plan.address)}
        </p>
        <h1 className="text-h1 mt-2 text-ink">
          Your investment:{" "}
          <span className="text-primary">{formatCurrency(r.netLandlordInvestment)}</span>.
          <br />
          Your return: <span className="text-primary">{r.landlordReturnPercent}% p.a.</span>
        </h1>

        <Card className="mt-5" accent="primary">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp size={16} aria-hidden="true" />
            <p className="text-[13px] font-semibold tracking-wide uppercase">
              Payback over time
            </p>
          </div>
          <div className="mt-2 h-40 w-full">
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
          <p className="text-small text-muted">
            Break-even around year 7 · positive return for the{" "}
            {plan.terms.maxTermYears - 7} years after
          </p>
        </Card>

        <Card className="mt-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light/10 text-primary">
            <Home size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-ink">
              Property value &amp; rentability
            </p>
            <p className="text-small mt-0.5 text-muted">
              Solar-equipped rentals in the Illawarra region list 4–6% faster
              and support marginally higher achievable rent, on top of the
              income from this agreement.
            </p>
          </div>
        </Card>

        <div className="mt-4">
          <Callout variant="warning" heading="Rebate step-down coming">
            The federal battery rebate drops again on{" "}
            {formatDate(rebateStepDownDate)}. Acting before then saves
            approximately {formatCurrency(rebateStepDownSavings)}.
          </Callout>
        </div>

        <div className="mt-6">
          {decision === "none" && (
            <div className="flex flex-col gap-3">
              <Button variant="landlord" fullWidth onClick={() => setDecision("accepted")}>
                <Check size={16} aria-hidden="true" /> Accept
              </Button>
              <Button variant="secondary" fullWidth onClick={() => setDecision("changes")}>
                <MessageSquare size={16} aria-hidden="true" /> Request changes
              </Button>
              <Button variant="danger" fullWidth onClick={() => setDecision("declined")}>
                <X size={16} aria-hidden="true" /> Decline
              </Button>
            </div>
          )}

          {decision === "accepted" && (
            <Card
              accent="primary"
              className="flex flex-col items-center gap-3 bg-primary-light/5 text-center animate-fade-up"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                <Check size={22} aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-ink">Proposal accepted</p>
                <p className="text-small mt-1 text-muted">
                  We&apos;ll notify your tenant so you can both confirm the final terms.
                </p>
              </div>
              <Button variant="landlord" fullWidth onClick={() => router.push("/plans")}>
                View plans
              </Button>
            </Card>
          )}

          {decision === "changes" && (
            <Card className="flex flex-col items-center gap-3 text-center animate-fade-up">
              <p className="font-semibold text-ink">Request sent</p>
              <p className="text-small text-muted">
                Your tenant will be notified to adjust the proposal.
              </p>
              <Button variant="secondary" fullWidth onClick={() => router.push("/dashboard")}>
                Back to dashboard
              </Button>
            </Card>
          )}

          {decision === "declined" && (
            <Card className="flex flex-col items-center gap-3 text-center animate-fade-up">
              <p className="font-semibold text-ink">Proposal declined</p>
              <p className="text-small text-muted">
                Your tenant will be notified. No agreement has been created.
              </p>
              <Button variant="secondary" fullWidth onClick={() => router.push("/dashboard")}>
                Back to dashboard
              </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
