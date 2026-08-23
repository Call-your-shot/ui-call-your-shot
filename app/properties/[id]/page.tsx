"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Callout from "@/components/ui/Callout";
import StatBlock from "@/components/ui/StatBlock";
import { useDemo } from "@/lib/demo-context";
import { formatPropertyAddress, getOwnedProperty } from "@/lib/accounts";
import { formatDate } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { AlertTriangle, Download, FileText, Mail, MessageCircle, UserPlus, Zap } from "lucide-react";
import { SystemHealthGauge } from "@/components/dashboard/SystemHealthGauge";
import { SinkingFundProgressBar } from "@/components/dashboard/SinkingFundProgressBar";
import { CapitalBurndownChart } from "@/components/dashboard/CapitalBurndownChart";
import { CashflowWaterfall } from "@/components/dashboard/CashflowWaterfall";
import { LiveSwitchboard } from "@/components/dashboard/LiveSwitchboard";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
    await refresh();
    setInviteOpen(false);
    setInviteEmail("");
  }

  async function updateLeaveRequestStatus(action: "acknowledge" | "approve") {
    if (!property?.leaveRequest) return;
    const response = await fetch(`/api/properties/${encodeURIComponent(property.id)}/leave-request/${action}`, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json();
      setActionError(payload.message ?? `Could not ${action} leave request`);
      return;
    }
    await refresh();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1">{formatPropertyAddress(property.address)}</h1>
          <p className="text-body mt-1">
            {property.currentTenant ? `Leased to ${property.currentTenant.name}` : "Not currently tenanted"}
          </p>
        </div>

        {/* 1-Click EOFY Tax Pack PDF Button */}
        <Button
          variant="secondary"
          onClick={() => alert(`Downloading EOFY Tax Summary PDF for ${formatPropertyAddress(property.address)}...`)}
          className="shrink-0"
        >
          <FileText size={16} className="text-primary" />
          <span>EOFY Tax Pack (PDF)</span>
          <Download size={14} className="text-grey-500" />
        </Button>
      </div>

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
            {/* Payback & Profit Intersection Line Chart (Full Width) */}
            <div className="lg:col-span-12">
              <CapitalBurndownChart
                totalInvested={property.totalInvested}
                totalEarned={property.totalEarned}
                breakEvenDate="Nov 2030"
              />
            </div>

            {/* Monthly Cash Flow Waterfall (Full Width) */}
            <div className="lg:col-span-12">
              <CashflowWaterfall
                tenantSalesDollars={69}
                exportCreditsDollars={13}
                reserveDeductionDollars={18}
                monthLabel="Aug 2025"
              />
            </div>

            {/* System Health Gauge (6 Cols) */}
            <div className="lg:col-span-6">
              <SystemHealthGauge
                efficiencyPercent={property.system?.performancePercent ?? 96}
                todayGenerationKwh={property.system?.todayGenerationKwh ?? 24.6}
                currentOutputKw={property.system?.currentOutputKw ?? 3.2}
                inverterModel={property.system?.inverterModel ?? "Fronius Primo 7.0-1"}
                warrantyExpiry={property.system?.warrantyExpiry ? formatDate(property.system.warrantyExpiry) : "1 Feb 2033"}
                hasAlert={!!property.performanceAlert}
                alertMessage={property.performanceAlert?.message}
                lastReadingAt={property.system?.lastReadingAt ? new Date(property.system.lastReadingAt).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }) : "2:30 PM"}
              />
            </div>

            {/* Sinking Fund Reserve Progress (6 Cols) */}
            <div className="lg:col-span-6">
              <SinkingFundProgressBar
                accruedDollars={property.maintenanceReserve?.accrued ?? 486}
                targetEstimateDollars={property.maintenanceReserve?.nextCostEstimate ?? 1500}
                nextCostDescription={property.maintenanceReserve?.nextCostDescription ?? "Inverter Replacement"}
                nextCostDate={property.maintenanceReserve?.nextCostDate ? formatDate(property.maintenanceReserve.nextCostDate) : "1 Feb 2035"}
              />
            </div>

            {/* Current Tenant Card */}
            <Card className="lg:col-span-12">
              <div className="flex items-center justify-between">
                <h2 className="text-h3">Current tenant status</h2>
                {property.currentTenant && (
                  <span className="rounded-full bg-success-light px-3 py-1 text-xs font-bold text-success-darker flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    Paid on 1 Aug (Direct Debit)
                  </span>
                )}
              </div>
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
                <div className="mt-3 rounded-xl bg-info-light/60 p-4 border border-info/30 text-xs">
                  <p className="font-bold text-info-darker">Property Currently Vacant — Vacancy Safeguard Active</p>
                  <p className="text-grey-700 mt-1">Solar generation during vacant period is being exported to grid @ 4¢/kWh feed-in tariff. The system continues earning money while re-letting.</p>
                </div>
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
                    <Button onClick={() => updateLeaveRequestStatus("acknowledge")}>Acknowledge</Button>
                    <Button variant="secondary" onClick={() => updateLeaveRequestStatus("approve")}>Approve move-out</Button>
                    <Button variant="secondary">
                      <MessageCircle size={16} aria-hidden="true" />
                      Message tenant
                    </Button>
                  </div>
                ) : property.leaveRequest.status === "approved" ? (
                  <div className="mt-4">
                    <Callout variant="success" heading="Move-out approved">
                      The tenant has been notified. The plan will close at the move-out date and the remaining balance stays with the property.
                    </Callout>
                    <Button variant="secondary" className="mt-3" onClick={() => setTab("Tenants")}>
                      <UserPlus size={16} aria-hidden="true" />
                      Invite new tenant
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
                  <Callout variant="warning" heading="Performance Alert">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{property.performanceAlert.message}</span>
                    </div>
                  </Callout>
                )}

                {/* Live Real-Time Telemetry Power Flow */}
                <LiveSwitchboard />

                {/* Technical Hardware Spec & Warranty Matrix */}
                <Card>
                  <div className="flex items-center justify-between border-b border-grey-100 pb-3">
                    <div>
                      <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
                        Hardware Specifications &amp; Protection
                      </span>
                      <h3 className="text-h3 mt-0.5 text-grey-900">Asset Hardware Matrix</h3>
                    </div>
                    <span className="rounded-full bg-success-light px-3 py-1 text-xs font-bold text-success-darker">
                      All Warranties Active
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-grey-200/80 bg-grey-50 p-3.5">
                      <p className="text-[11px] font-bold text-grey-500 uppercase">Rooftop Solar Array</p>
                      <p className="text-lg font-black text-grey-900 mt-0.5">{property.system.sizeKw} kW Array</p>
                      <p className="text-xs font-semibold text-grey-700 mt-1">{property.system.panelCount}x Trina Solar 440W Panels</p>
                      <p className="text-[11px] font-bold text-success mt-2">25-Yr Performance Warranty (2048)</p>
                    </div>

                    <div className="rounded-xl border border-grey-200/80 bg-grey-50 p-3.5">
                      <p className="text-[11px] font-bold text-grey-500 uppercase">Primary Inverter</p>
                      <p className="text-lg font-black text-grey-900 mt-0.5">{property.system.inverterModel}</p>
                      <p className="text-xs font-semibold text-grey-700 mt-1">Single-Phase Smart Inverter</p>
                      <p className="text-[11px] font-bold text-success mt-2">10-Yr Warranty (Until {formatDate(property.system.warrantyExpiry)})</p>
                    </div>

                    <div className="rounded-xl border border-grey-200/80 bg-grey-50 p-3.5">
                      <p className="text-[11px] font-bold text-grey-500 uppercase">Battery Storage</p>
                      <p className="text-lg font-black text-grey-900 mt-0.5">Tesla Powerwall 2</p>
                      <p className="text-xs font-semibold text-grey-700 mt-1">13.5 kWh Usable Capacity</p>
                      <p className="text-[11px] font-bold text-info-darker mt-2">90% State of Health (SOH)</p>
                    </div>
                  </div>
                </Card>

                {/* 30-Day Daily Solar Yield & Solar Irradiance Chart */}
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
                        30-Day Generation Telemetry
                      </span>
                      <h3 className="text-h3 mt-0.5 text-grey-900">Daily Solar Yield (kWh)</h3>
                    </div>
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

                  <div className="mt-4 h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {generationView === "daily" ? (
                        <BarChart
                          data={property.system.dailyOutputKwh30d.map((kwh, i) => ({ day: `Day ${i + 1}`, kwh }))}
                          margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                        >
                          <CartesianGrid vertical={false} stroke="#F4F6F8" strokeDasharray="4 4" />
                          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#919EAB" }} axisLine={false} tickLine={false} interval={4} />
                          <YAxis tick={{ fontSize: 11, fill: "#919EAB" }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(v) => [`${v} kWh`, "Generation"]}
                            contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", boxShadow: "var(--shadow-card)" }}
                          />
                          <Bar dataKey="kwh" radius={[4, 4, 0, 0]} fill="#00A76F" />
                        </BarChart>
                      ) : (
                        <AreaChart data={property.monthly} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="genFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00A76F" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#00A76F" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="#F4F6F8" strokeDasharray="4 4" />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#919EAB" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#919EAB" }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(v) => [`${v} kWh`, "Generation"]}
                            contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", boxShadow: "var(--shadow-card)" }}
                          />
                          <Area type="monotone" dataKey="generationKwh" stroke="#00A76F" strokeWidth={2.5} fill="url(#genFill)" />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Sinking Fund & Maintenance Log */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-7">
                    <SinkingFundProgressBar
                      accruedDollars={property.maintenanceReserve?.accrued ?? 486}
                      targetEstimateDollars={property.maintenanceReserve?.nextCostEstimate ?? 1500}
                      nextCostDescription={property.maintenanceReserve?.nextCostDescription ?? "Inverter Replacement"}
                      nextCostDate={property.maintenanceReserve?.nextCostDate ? formatDate(property.maintenanceReserve.nextCostDate) : "1 Feb 2035"}
                    />
                  </div>

                  <Card className="lg:col-span-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-h3">Service History</h3>
                      <div className="mt-3 flex flex-col divide-y divide-dashed divide-line">
                        {property.system.serviceHistory.map((s) => (
                          <div key={s.date} className="flex items-center justify-between py-2.5">
                            <span className="text-[13px] font-semibold text-grey-900">{s.description}</span>
                            <span className="text-xs text-grey-500 font-medium">{formatDate(s.date)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-grey-100 flex items-center justify-between text-xs font-bold text-primary">
                      <span>Annual Inspection Completed</span>
                      <span>Next Due: Aug 2026</span>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "Financials" && (() => {
          // Pre-calculate cumulative revenue for the balance projection line
          let runningTotal = property.totalEarned - property.monthly.reduce((s, m) => s + m.netIncome, 0);
          const cumulativeMonthly = property.monthly.map((m) => {
            runningTotal += m.netIncome;
            return {
              ...m,
              cumulativeRecovered: Math.round(runningTotal),
            };
          });

          const totalGen = property.monthly.reduce((s, m) => s + m.generationKwh, 0);
          const totalTenant = property.monthly.reduce((s, m) => s + m.tenantChargeCollected, 0);
          const totalExport = property.monthly.reduce((s, m) => s + m.exportCredits, 0);
          const totalReserve = property.monthly.reduce((s, m) => s + m.reserveContribution, 0);
          const totalNet = property.monthly.reduce((s, m) => s + m.netIncome, 0);

          return (
            <div className="flex flex-col gap-6">
              {/* Payback & Cashflow Projection Composed Chart */}
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
                      Financial Performance &amp; Payback
                    </span>
                    <h3 className="text-h3 mt-0.5 text-grey-900">Cumulative Capital Recovery ($)</h3>
                  </div>
                  <span className="rounded-full bg-success-light px-3 py-1 text-xs font-bold text-success-darker">
                    {Math.round((property.totalEarned / property.totalInvested) * 100)}% Recouped
                  </span>
                </div>

                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={cumulativeMonthly} margin={{ top: 12, right: 12, bottom: 0, left: -16 }}>
                      <CartesianGrid vertical={false} stroke="#F4F6F8" strokeDasharray="4 4" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#919EAB" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#919EAB" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#919EAB" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        formatter={(v, name) => [
                          formatCurrency(Number(v)),
                          name === "netIncome" ? "Monthly Net Payout" : "Cumulative Capital Recovered",
                        ]}
                        contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", boxShadow: "var(--shadow-card)" }}
                      />
                      <Bar yAxisId="left" dataKey="netIncome" name="netIncome" radius={[4, 4, 0, 0]} fill="#00A76F" />
                      <Line yAxisId="right" type="monotone" dataKey="cumulativeRecovered" name="cumulativeRecovered" stroke="#FFAB00" strokeWidth={3} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-grey-100 pt-2.5 text-xs text-grey-600 font-semibold">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#00A76F]" />
                      <span>Monthly Net Payout ($)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FFAB00]" />
                      <span>Cumulative Recovered ($)</span>
                    </div>
                  </div>
                  <span>Payback Progress: ${property.totalEarned.toLocaleString()} / ${property.totalInvested.toLocaleString()}</span>
                </div>
              </Card>

              {/* Income Statement Table & CSV Export */}
              <Card className="overflow-hidden p-0">
                <div className="p-6 pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[12px] font-bold tracking-wider text-grey-500 uppercase">
                      Statement Audit Log
                    </span>
                    <h3 className="text-h3 mt-0.5 text-grey-900">Income by Month</h3>
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => {
                      const csvHeader = "Month,Generation (kWh),Tenant Charge ($),Export Credits ($),Reserve ($),Net Payout ($)\n";
                      const csvRows = property.monthly
                        .map((m) => `${m.month},${m.generationKwh},${m.tenantChargeCollected},${m.exportCredits},${m.reserveContribution},${m.netIncome}`)
                        .join("\n");
                      const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `sunshare-statements-${property.id}.csv`;
                      a.click();
                    }}
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-[14px]">
                    <thead>
                      <tr className="bg-grey-100 text-left text-[12px] font-semibold tracking-wide text-grey-600 uppercase border-y border-grey-200">
                        <th className="px-6 py-3">Month</th>
                        <th className="px-6 py-3 text-right">Generation</th>
                        <th className="px-6 py-3 text-right">Tenant Charge</th>
                        <th className="px-6 py-3 text-right">Export Credits</th>
                        <th className="px-6 py-3 text-right">Reserve</th>
                        <th className="px-6 py-3 text-right">Net Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...property.monthly].reverse().map((m) => (
                        <tr key={m.month} className="h-[52px] border-b border-dashed border-line hover:bg-grey-50/50">
                          <td className="px-6 font-medium text-grey-900">{m.month}</td>
                          <td className="px-6 text-right tabular-nums text-grey-600">{m.generationKwh} kWh</td>
                          <td className="px-6 text-right tabular-nums text-grey-600">{formatCurrency(m.tenantChargeCollected)}</td>
                          <td className="px-6 text-right tabular-nums text-grey-600">{formatCurrency(m.exportCredits)}</td>
                          <td className="px-6 text-right tabular-nums text-grey-600">− {formatCurrency(m.reserveContribution)}</td>
                          <td className="px-6 text-right font-bold tabular-nums text-success">{formatCurrency(m.netIncome)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-grey-50 border-t-2 border-grey-300 font-extrabold text-grey-900">
                        <td className="px-6 py-3.5">Total to Date</td>
                        <td className="px-6 py-3.5 text-right tabular-nums">{totalGen.toLocaleString()} kWh</td>
                        <td className="px-6 py-3.5 text-right tabular-nums">{formatCurrency(totalTenant)}</td>
                        <td className="px-6 py-3.5 text-right tabular-nums">{formatCurrency(totalExport)}</td>
                        <td className="px-6 py-3.5 text-right tabular-nums">− {formatCurrency(totalReserve)}</td>
                        <td className="px-6 py-3.5 text-right tabular-nums text-success">{formatCurrency(totalNet)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </div>
          );
        })()}
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
