"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProgressRing from "@/components/ui/ProgressRing";
import StatBlock from "@/components/ui/StatBlock";
import { useDemo } from "@/lib/demo-context";
import { formatPropertyAddress, getTenancy, totalSavingsToDate } from "@/lib/accounts";
import { formatDate } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Check, Download, MessageCircle } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";

function formatCurrency(v: number, cents = false) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(v);
}

const fairnessGuarantees = [
  "You never pay more than grid price in any half hour",
  "You can leave at any time with no penalty",
  "The balance stays with the property, not with you",
  "The charge stops permanently once the balance is repaid",
  "The charge suspends automatically if the system stops generating",
];

const TABS = ["Overview", "Your landlord", "Plan terms", "Statements"] as const;
type Tab = (typeof TABS)[number];

export default function PlanDetailPage() {
  const params = useParams<{ id: string }>();
  const { account, hydrated } = useDemo();
  const tenancy = getTenancy(account, params.id);
  const [tab, setTab] = useState<Tab>("Overview");
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  // Wait for the demo account to sync from localStorage before treating a
  // miss as a real 404 — otherwise a direct link into a non-default demo
  // account's plan briefly checks against the default account first.
  if (!hydrated) return null;
  if (!tenancy) return notFound();

  const percentRepaid =
    tenancy.balanceTotal > 0 ? Math.round((tenancy.balanceRepaid / tenancy.balanceTotal) * 100) : 0;
  const savingsToDate = totalSavingsToDate(tenancy);
  const lastMonth = tenancy.monthly[tenancy.monthly.length - 1];

  return (
    <div>
      <h1 className="text-h1">{formatPropertyAddress(tenancy.address)}</h1>
      <p className="text-body mt-1">Plan with {tenancy.landlordName}</p>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 border-b-2 px-3 pb-3 text-[14px] font-semibold whitespace-nowrap",
              tab === t ? "border-primary text-primary" : "border-transparent text-grey-500"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-12">
              <div className="flex flex-col items-center gap-8 sm:flex-row">
                <ProgressRing percent={percentRepaid}>
                  <span className="text-data">{percentRepaid}%</span>
                  <span className="text-[13px] font-semibold text-grey-500">repaid</span>
                </ProgressRing>
                <div className="flex flex-1 flex-col gap-5 sm:pl-4">
                  <StatBlock label="Repaid" value={formatCurrency(tenancy.balanceRepaid)} />
                  <StatBlock
                    label="Outstanding"
                    value={formatCurrency(tenancy.balanceTotal - tenancy.balanceRepaid)}
                  />
                  <StatBlock
                    label="Estimated completion"
                    value={tenancy.estimatedCompletionDate ? formatDate(tenancy.estimatedCompletionDate) : "—"}
                  />
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-6">
              <StatBlock
                label="Savings to date"
                value={formatCurrency(savingsToDate)}
                valueClassName="text-success"
                caption="Across the life of this plan"
              />
            </Card>
            <Card className="lg:col-span-6">
              <StatBlock
                label="Plan start date"
                value={tenancy.startDate ? formatDate(tenancy.startDate) : "—"}
              />
            </Card>

            {lastMonth && (
              <Card className="lg:col-span-12">
                <h2 className="text-h3">This month</h2>
                <div className="mt-3 grid grid-cols-3 gap-4">
                  <StatBlock label="Solar used" value={`${lastMonth.solarUsedKwh} kWh`} />
                  <StatBlock label="Grid used" value={`${lastMonth.gridUsedKwh} kWh`} />
                  <StatBlock label="Total" value={formatCurrency(lastMonth.chargeDollars, true)} />
                </div>
              </Card>
            )}
          </div>
        )}

        {tab === "Your landlord" && (
          <div className="flex flex-col gap-6">
            <Card>
              <h2 className="text-h3">{tenancy.landlordName}</h2>
              <div className="mt-3 flex flex-col gap-2 text-[14px]">
                <Row label="Contact" value="Message via SunShare" />
                {tenancy.propertyManager && <Row label="Property manager" value={tenancy.propertyManager} />}
                <Row
                  label="Plan agreed"
                  value={tenancy.landlordAgreedDate ? formatDate(tenancy.landlordAgreedDate) : "—"}
                />
              </div>
              {!messageOpen ? (
                <Button variant="secondary" className="mt-4" onClick={() => setMessageOpen(true)}>
                  <MessageCircle size={16} aria-hidden="true" />
                  Message
                </Button>
              ) : messageSent ? (
                <div className="mt-4 rounded-lg bg-success-light p-3 text-[13px] font-medium text-success">
                  Message sent to {tenancy.landlordName}.
                </div>
              ) : (
                <div className="mt-4">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={3}
                    placeholder={`Write a message to ${tenancy.landlordName}...`}
                    className="w-full rounded-lg border border-line bg-surface-alt px-3.5 py-2.5 text-[14px] outline-none focus:border-primary focus:bg-surface"
                  />
                  <Button
                    className="mt-2"
                    disabled={!messageText.trim()}
                    onClick={() => setMessageSent(true)}
                  >
                    Send message
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === "Plan terms" && (
          <div className="flex flex-col gap-6">
            <Card>
              <h2 className="text-h3">Agreed terms</h2>
              <div className="mt-3 flex flex-col gap-2 text-[14px]">
                <Row label="Solar rate" value={`${tenancy.ratePerKwhCents}¢ / kWh`} />
                <Row label="Maximum term" value={`${tenancy.maxTermYears} years`} />
                <Row label="Monthly reserve contribution" value={formatCurrency(tenancy.monthlyReserveContribution)} />
              </div>
            </Card>
            <Card>
              <h2 className="text-h3">Fairness guarantees</h2>
              <ul className="mt-3 flex flex-col gap-2.5">
                {fairnessGuarantees.map((g) => (
                  <li key={g} className="flex items-start gap-2 text-[14px]">
                    <Check size={15} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                    {g}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {tab === "Statements" && (
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="text-h3">Monthly statements</h2>
              <button className="flex items-center gap-1 text-[13px] font-bold text-primary hover:underline">
                <Download size={14} aria-hidden="true" />
                Export
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-[14px]">
                <thead>
                  <tr className="bg-grey-200 text-left text-[12px] font-semibold tracking-wide text-grey-600 uppercase">
                    <th className="px-6 py-3">Month</th>
                    <th className="px-6 py-3 text-right">Solar used</th>
                    <th className="px-6 py-3 text-right">Grid used</th>
                    <th className="px-6 py-3 text-right">Charged</th>
                    <th className="px-6 py-3 text-right">Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {[...tenancy.monthly].reverse().map((m, i, arr) => (
                    <tr key={m.month} className={cn("h-[60px] border-b border-dashed border-line", i === arr.length - 1 && "border-0")}>
                      <td className="px-6 font-medium">{m.month}</td>
                      <td className="px-6 text-right tabular-nums text-grey-600">{m.solarUsedKwh} kWh</td>
                      <td className="px-6 text-right tabular-nums text-grey-600">{m.gridUsedKwh} kWh</td>
                      <td className="px-6 text-right tabular-nums text-grey-600">{formatCurrency(m.chargeDollars, true)}</td>
                      <td className="px-6 text-right font-semibold tabular-nums text-success">
                        {formatCurrency(m.savingsDollars, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {tenancy.status === "active" && (
        <Card className="mt-8 border-2 border-line bg-surface shadow-none">
          <h2 className="text-h3">Leaving this property?</h2>
          <p className="text-body mt-1">
            You can give notice any time — there&apos;s no penalty, and you won&apos;t owe anything.
          </p>
          <Button href={`/plans/${tenancy.id}/leave`} variant="secondary" className="mt-4">
            Give notice to leave
          </Button>
        </Card>
      )}

      {tenancy.status === "leaving" && tenancy.leaveRequest && (
        <Card className="mt-8 border-2 border-warning/40 bg-warning-light shadow-none">
          <h2 className="text-h3 text-warning">You&apos;ve given notice</h2>
          <p className="text-body mt-1">
            Move-out date: {formatDate(tenancy.leaveRequest.moveOutDate)}
          </p>
          <Button href={`/plans/${tenancy.id}/leave`} variant="secondary" className="mt-4">
            View status
          </Button>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-line pb-2 last:border-0">
      <span className="text-grey-600">{label}</span>
      <span className="font-medium text-grey-900">{value}</span>
    </div>
  );
}
