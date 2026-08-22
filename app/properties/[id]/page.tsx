"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Callout from "@/components/ui/Callout";
import StatBlock from "@/components/ui/StatBlock";
import { useDemo } from "@/lib/demo-context";
import { formatPropertyAddress, getOwnedProperty } from "@/lib/accounts";
import { formatDate } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { AlertTriangle, Mail, MessageCircle, UserPlus, Zap } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v);
}

const TABS = ["Overview", "Tenants", "Leave requests", "Solar system", "Financials"] as const;
type Tab = (typeof TABS)[number];

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const { account, hydrated, refresh } = useDemo();
  const property = getOwnedProperty(account, params.id);
  const [tab, setTab] = useState<Tab>("Overview");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [generationView, setGenerationView] = useState<"daily" | "monthly">("daily");
  const [actionError, setActionError] = useState("");

  // See the matching guard in plans/[id]/page.tsx for why this waits on
  // `hydrated` before treating a miss as a real 404.
  if (!hydrated) return null;
  if (!property) return notFound();

  const percentRecovered =
    property.totalInvested > 0 ? Math.round((property.totalEarned / property.totalInvested) * 100) : 0;

  async function sendInvite() {
    if (!property || !inviteEmail.trim()) return;
    setActionError("");
    const response = await fetch(`/api/properties/${encodeURIComponent(property.id)}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteEmail: inviteEmail.trim() }),
    });
    if (!response.ok) {
      const payload = await response.json();
      setActionError(payload.message ?? "Could not send invitation");
      return;
    }
    refresh();
    setInviteOpen(false);
    setInviteEmail("");
  }

  async function acknowledgeLeaveRequest() {
    if (!property?.leaveRequest) return;
    const response = await fetch(`/api/properties/${encodeURIComponent(property.id)}/leave-request/acknowledge`, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json();
      setActionError(payload.message ?? "Could not acknowledge leave request");
      return;
    }
    refresh();
  }

  return (
    <div>
      <h1 className="text-h1">{formatPropertyAddress(property.address)}</h1>
      <p className="text-body mt-1">
        {property.currentTenant ? `Leased to ${property.currentTenant.name}` : "Not currently tenanted"}
      </p>
      {actionError && <p className="mt-3 rounded-lg bg-error-light p-3 text-small text-error" role="alert">{actionError}</p>}

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
            {t === "Leave requests" && property.leaveRequest?.status === "pending" && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                1
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-12">
              <div className="grid grid-cols-2 gap-6">
                <StatBlock label="Total earned" value={formatCurrency(property.totalEarned)} valueClassName="text-success" />
                <StatBlock label="Monthly income" value={`${formatCurrency(property.monthlyIncome)}/mo`} />
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-grey-600">
                  <span>Investment recovered</span>
                  <span>{percentRecovered}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-grey-300">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, percentRecovered)}%` }} />
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-12">
              <h2 className="text-h3">Current tenant</h2>
              {property.currentTenant ? (
                <div className="mt-3 flex flex-col gap-2 text-[14px]">
                  <Row label="Name" value={property.currentTenant.name} />
                  <Row label="Tenancy start" value={formatDate(property.currentTenant.tenancyStart)} />
                  <Row label="Plan rate" value={`${property.currentTenant.ratePerKwhCents}¢ / kWh`} />
                  <Row label="Contribution to date" value={formatCurrency(property.currentTenant.contributionToBalance)} />
                </div>
              ) : property.occupancyStatus === "pending_invitation" ? (
                <p className="text-body mt-2">
                  Invitation pending{property.pendingInvitationEmail ? ` — ${property.pendingInvitationEmail}` : ""}.
                </p>
              ) : (
                <p className="text-body mt-2">This property is currently vacant.</p>
              )}
            </Card>
          </div>
        )}

        {tab === "Tenants" && (
          <div className="flex flex-col gap-6">
            {property.currentTenant && (
              <Card>
                <h2 className="text-h3">Current tenant</h2>
                <div className="mt-3 flex flex-col gap-2 text-[14px]">
                  <Row label="Name" value={property.currentTenant.name} />
                  <Row label="Tenancy start" value={formatDate(property.currentTenant.tenancyStart)} />
                  <Row label="Plan rate" value={`${property.currentTenant.ratePerKwhCents}¢ / kWh`} />
                  <Row label="Contribution to date" value={formatCurrency(property.currentTenant.contributionToBalance)} />
                </div>
              </Card>
            )}

            <Card>
              <div className="flex items-center justify-between">
                <h2 className="text-h3">Tenant history</h2>
              </div>
              <p className="text-small mt-1">
                What each tenant has contributed to the balance — it carries across tenancies, it never resets.
              </p>
              <div className="mt-4 flex flex-col divide-y divide-dashed divide-line">
                {property.tenantHistory.length === 0 ? (
                  <p className="text-body py-3">No tenants yet.</p>
                ) : (
                  property.tenantHistory.map((t) => (
                    <div key={`${t.name}-${t.tenancyStart}`} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-[14px] font-semibold text-grey-900">
                          {t.name} {t.current && <span className="text-[12px] font-medium text-success">(current)</span>}
                        </p>
                        <p className="text-small">
                          {formatDate(t.tenancyStart)} — {t.tenancyEnd ? formatDate(t.tenancyEnd) : "present"}
                        </p>
                      </div>
                      <p className="tabular-nums text-[14px] font-bold text-grey-900">
                        {formatCurrency(t.contributionToBalance)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <div className="flex flex-wrap gap-3">
              {!inviteOpen ? (
                <Button variant="secondary" onClick={() => setInviteOpen(true)}>
                  <UserPlus size={16} aria-hidden="true" />
                  Invite new tenant
                </Button>
              ) : (
                <Card className="w-full max-w-sm">
                  <p className="text-[14px] font-semibold text-grey-900">Invite a tenant</p>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-surface-alt px-3 py-2.5">
                    <Mail size={16} className="text-grey-500" aria-hidden="true" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="tenant@example.com"
                      className="w-full bg-transparent text-[14px] outline-none"
                    />
                  </div>
                  <Button className="mt-3" disabled={!inviteEmail.trim()} onClick={sendInvite}>
                    Send invitation
                  </Button>
                </Card>
              )}
              <Button variant="secondary" onClick={() => setTab("Leave requests")}>
                View leave requests
              </Button>
            </div>
          </div>
        )}

        {tab === "Leave requests" && (
          <div className="flex flex-col gap-6">
            {!property.leaveRequest ? (
              <Card className="flex flex-col items-center py-10 text-center">
                <p className="text-h3">No leave requests</p>
                <p className="text-body mt-1 max-w-sm">
                  When a tenant gives notice to leave, it&apos;ll show up here.
                </p>
              </Card>
            ) : (
              <Card>
                <h2 className="text-h3">{property.leaveRequest.tenantName}</h2>
                <div className="mt-3 flex flex-col gap-2 text-[14px]">
                  <Row label="Requested" value={formatDate(property.leaveRequest.requestedDate)} />
                  <Row label="Move-out date" value={formatDate(property.leaveRequest.moveOutDate)} />
                  <Row label="Reason" value={property.leaveRequest.reason} />
                </div>

                {property.leaveRequest.status === "pending" ? (
                  <div className="mt-4 flex gap-3">
                    <Button onClick={acknowledgeLeaveRequest}>Acknowledge</Button>
                    <Button variant="secondary">
                      <MessageCircle size={16} aria-hidden="true" />
                      Message tenant
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4">
                    <Callout variant="success" heading="Acknowledged">
                      A final statement will be issued on the move-out date. The
                      balance stays with the property — invite a new tenant when
                      you&apos;re ready.
                    </Callout>
                    <Button variant="secondary" className="mt-3" onClick={() => setTab("Tenants")}>
                      <UserPlus size={16} aria-hidden="true" />
                      Invite new tenant
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {tab === "Solar system" && (
          <div className="flex flex-col gap-6">
            {!property.system ? (
              <Card className="flex flex-col items-center py-10 text-center">
                <p className="text-h3">No system installed yet</p>
              </Card>
            ) : (
              <>
                {property.performanceAlert && (
                  <Callout variant="warning" heading="Performance alert">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{property.performanceAlert.message}</span>
                    </div>
                  </Callout>
                )}

                <Card>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatBlock label="System size" value={`${property.system.sizeKw} kW`} />
                    <StatBlock label="Panels" value={property.system.panelCount} />
                    <StatBlock label="Install date" value={formatDate(property.system.installDate)} />
                    <StatBlock label="Warranty until" value={formatDate(property.system.warrantyExpiry)} />
                  </div>
                  <p className="text-small mt-3">Inverter: {property.system.inverterModel}</p>
                </Card>

                <Card>
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-lg p-3",
                      property.system.status === "normal" ? "bg-success-light" : "bg-warning-light"
                    )}
                  >
                    <Zap
                      size={16}
                      className={property.system.status === "normal" ? "text-success" : "text-warning"}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        "text-[13px] font-semibold",
                        property.system.status === "normal" ? "text-success" : "text-warning"
                      )}
                    >
                      {property.system.status === "normal" ? "Operating normally" : "Reduced output detected"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <StatBlock label="Today's generation" value={`${property.system.todayGenerationKwh} kWh`} />
                    <StatBlock label="Current output" value={`${property.system.currentOutputKw} kW`} />
                    <StatBlock
                      label="Vs expected"
                      value={`${property.system.performancePercent}%`}
                      valueClassName={property.system.performancePercent < 80 ? "text-error" : "text-success"}
                    />
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between">
                    <h2 className="text-h3">Generation</h2>
                    <div className="flex gap-1 rounded-lg bg-grey-200 p-0.5">
                      {(["daily", "monthly"] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setGenerationView(v)}
                          className={cn(
                            "rounded-md px-2.5 py-1 text-[12px] font-semibold capitalize",
                            generationView === v ? "bg-surface text-primary shadow-sm-card" : "text-grey-600"
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {generationView === "daily" ? (
                        <BarChart
                          data={property.system.dailyOutputKwh30d.map((kwh, i) => ({ day: i + 1, kwh }))}
                          margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                        >
                          <CartesianGrid vertical={false} stroke="#F4F6F8" strokeDasharray="4 4" />
                          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#919EAB" }} axisLine={false} tickLine={false} interval={4} />
                          <Tooltip
                            formatter={(v) => [`${v} kWh`, "Generated"]}
                            contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", boxShadow: "var(--shadow-card)" }}
                          />
                          <Bar dataKey="kwh" radius={[3, 3, 0, 0]} fill="#00A76F" />
                        </BarChart>
                      ) : (
                        <AreaChart data={property.monthly} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="genFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00A76F" stopOpacity={0.24} />
                              <stop offset="100%" stopColor="#00A76F" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="#F4F6F8" strokeDasharray="4 4" />
                          <XAxis
                            dataKey="month"
                            tickFormatter={(m: string) => m.split(" ")[0][0]}
                            tick={{ fontSize: 11, fill: "#919EAB" }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                          />
                          <Tooltip
                            formatter={(v) => [`${v} kWh`, "Generated"]}
                            contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", boxShadow: "var(--shadow-card)" }}
                          />
                          <Area type="monotone" dataKey="generationKwh" stroke="#00A76F" strokeWidth={2.5} fill="url(#genFill)" />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-h3">Maintenance reserve</h2>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <StatBlock label="Accrued" value={formatCurrency(property.maintenanceReserve.accrued)} />
                    <StatBlock
                      label={property.maintenanceReserve.nextCostDescription}
                      value={formatDate(property.maintenanceReserve.nextCostDate)}
                      caption={`Est. ${formatCurrency(property.maintenanceReserve.nextCostEstimate)}`}
                    />
                  </div>
                </Card>

                <Card>
                  <h2 className="text-h3">Service history</h2>
                  <div className="mt-3 flex flex-col divide-y divide-dashed divide-line">
                    {property.system.serviceHistory.map((s) => (
                      <div key={s.date} className="flex items-center justify-between py-2.5">
                        <span className="text-[14px] text-grey-900">{s.description}</span>
                        <span className="text-small">{formatDate(s.date)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {tab === "Financials" && (
          <div className="flex flex-col gap-6">
            <Card>
              <h2 className="text-h3">Balance projection</h2>
              <div className="mt-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={property.monthly} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00A76F" stopOpacity={0.24} />
                        <stop offset="100%" stopColor="#00A76F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#F4F6F8" strokeDasharray="4 4" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(m: string) => m.split(" ")[0][0]}
                      tick={{ fontSize: 11, fill: "#919EAB" }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <Tooltip
                      formatter={(v) => [formatCurrency(Number(v)), "Net"]}
                      contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", boxShadow: "var(--shadow-card)" }}
                    />
                    <Area type="monotone" dataKey="netIncome" stroke="#00A76F" strokeWidth={2.5} fill="url(#netFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="overflow-hidden p-0">
              <h2 className="text-h3 p-6 pb-0">Income by month</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-[14px]">
                  <thead>
                    <tr className="bg-grey-200 text-left text-[12px] font-semibold tracking-wide text-grey-600 uppercase">
                      <th className="px-6 py-3">Month</th>
                      <th className="px-6 py-3 text-right">Generation</th>
                      <th className="px-6 py-3 text-right">Tenant charge</th>
                      <th className="px-6 py-3 text-right">Export credits</th>
                      <th className="px-6 py-3 text-right">Reserve</th>
                      <th className="px-6 py-3 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...property.monthly].reverse().map((m, i, arr) => (
                      <tr key={m.month} className={cn("h-[60px] border-b border-dashed border-line", i === arr.length - 1 && "border-0")}>
                        <td className="px-6 font-medium">{m.month}</td>
                        <td className="px-6 text-right tabular-nums text-grey-600">{m.generationKwh} kWh</td>
                        <td className="px-6 text-right tabular-nums text-grey-600">{formatCurrency(m.tenantChargeCollected)}</td>
                        <td className="px-6 text-right tabular-nums text-grey-600">{formatCurrency(m.exportCredits)}</td>
                        <td className="px-6 text-right tabular-nums text-grey-600">− {formatCurrency(m.reserveContribution)}</td>
                        <td className="px-6 text-right font-semibold tabular-nums text-success">{formatCurrency(m.netIncome)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
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
