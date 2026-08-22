"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useDemo } from "@/lib/demo-context";
import { fetchSolarData } from "@/lib/solar/client";
import type { SolarResult } from "@/lib/solar/types";
import type { OwnedProperty } from "@/lib/accounts";
import { Check, Loader2, Mail, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "address" | "looking-up" | "system" | "invite" | "done";

export default function AddPropertyPage() {
  const router = useRouter();
  const { account, refresh } = useDemo();

  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState("");
  const [solarResult, setSolarResult] = useState<SolarResult | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [newPropertyId, setNewPropertyId] = useState<string | null>(null);

  async function lookUp() {
    if (!address.trim()) return;
    setStep("looking-up");
    const res = await fetchSolarData({ address, scenario: "bellambi" });
    if (res.ok) {
      setSolarResult(res.result);
    } else {
      setSolarResult(res.fallback ?? null);
    }
    setStep("system");
  }

  function createProperty(withInviteEmail?: string) {
    const id = `prop-new-${Date.now()}`;
    const newProperty: OwnedProperty = {
      id,
      address: {
        street: address.split(",")[0] || address,
        suburb: solarResult?.formattedAddress.split(",")[1]?.trim() ?? "",
        state: "NSW",
        postcode: "",
      },
      imageVariant: Math.floor(Math.random() * 6),
      occupancyStatus: withInviteEmail ? "pending_invitation" : "vacant",
      system: solarResult
        ? {
            sizeKw: solarResult.system.systemSizeKw,
            panelCount: solarResult.system.panelCount,
            installDate: new Date().toISOString().slice(0, 10),
            inverterModel: "To be confirmed at installation",
            warrantyExpiry: "",
            status: "normal",
            todayGenerationKwh: 0,
            currentOutputKw: 0,
            performancePercent: 100,
            lastReadingAt: new Date().toISOString(),
            dailyOutputKwh30d: [],
            serviceHistory: [],
          }
        : undefined,
      tenantHistory: [],
      monthlyIncome: 0,
      balanceOutstanding: solarResult ? solarResult.system.estimatedAnnualAcKwh * 0.15 * 6.7 : 0,
      balanceTotal: solarResult ? solarResult.system.estimatedAnnualAcKwh * 0.15 * 6.7 : 0,
      totalEarned: 0,
      totalInvested: solarResult ? solarResult.system.estimatedAnnualAcKwh * 0.15 * 6.7 : 0,
      monthly: [],
      maintenanceReserve: { accrued: 0, nextCostDescription: "First inspection", nextCostDate: "", nextCostEstimate: 150 },
      pendingInvitationEmail: withInviteEmail,
    };
    // Mutating the mock account store in place — see the `refresh` doc
    // comment in demo-context.tsx for why.
    account.ownedProperties.push(newProperty);
    refresh();
    setNewPropertyId(id);
    setStep("done");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-h1">Add a property</h1>

      {step === "address" && (
        <Card className="mt-6">
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-semibold text-grey-900">Property address</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 12 Example Street, Wollongong NSW 2500"
              className="w-full rounded-lg border border-line bg-surface-alt px-3.5 py-2.5 text-[15px] outline-none focus:border-primary focus:bg-surface"
            />
          </label>
          <Button className="mt-4" disabled={!address.trim()} onClick={lookUp}>
            Look up roof potential
          </Button>
        </Card>
      )}

      {step === "looking-up" && (
        <Card className="mt-6 flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 size={28} className="animate-spin text-primary" aria-hidden="true" />
          <p className="text-body">Checking solar potential for this address…</p>
        </Card>
      )}

      {step === "system" && (
        <Card className="mt-6">
          {solarResult ? (
            <>
              <h2 className="text-h3">System potential</h2>
              <div className="mt-3 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-data">{solarResult.system.panelCount}</p>
                  <p className="text-small">Panels</p>
                </div>
                <div>
                  <p className="text-data">{solarResult.system.systemSizeKw}</p>
                  <p className="text-small">kW system</p>
                </div>
                <div>
                  <p className="text-data">{Math.round(solarResult.system.estimatedAnnualAcKwh / 1000)}</p>
                  <p className="text-small">MWh / year</p>
                </div>
              </div>
              {solarResult.source === "mock" && (
                <p className="text-small mt-3 rounded-lg bg-grey-200 px-3 py-2 text-grey-600">
                  Demonstration data
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="text-h3">No system yet</h2>
              <p className="text-body mt-1">
                We couldn&apos;t find detailed roof data for this address. You can still add the
                property and set up a system later.
              </p>
            </>
          )}
          <Button className="mt-5" onClick={() => setStep("invite")}>
            Continue
          </Button>
        </Card>
      )}

      {step === "invite" && (
        <Card className="mt-6">
          <h2 className="text-h3">Invite a tenant now?</h2>
          <p className="text-body mt-1">You can always do this later from the property page.</p>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-surface-alt px-3 py-2.5">
            <Mail size={16} className="text-grey-500" aria-hidden="true" />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="tenant@example.com"
              className="w-full bg-transparent text-[14px] outline-none"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => createProperty()}>
              Skip for now
            </Button>
            <Button fullWidth disabled={!inviteEmail.trim()} onClick={() => createProperty(inviteEmail.trim())}>
              <UserPlus size={16} aria-hidden="true" />
              Invite &amp; finish
            </Button>
          </div>
        </Card>
      )}

      {step === "done" && newPropertyId && (
        <Card className="mt-6 flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-light text-success">
            <Check size={26} aria-hidden="true" />
          </span>
          <h2 className="text-h3">Property added</h2>
          <p className="text-body max-w-sm">
            {account.name.split(" ")[0]}, your property is ready. You can manage its system, tenants
            and finances from its property page.
          </p>
          <Button className="mt-2" onClick={() => router.push(`/properties/${newPropertyId}`)}>
            View property
          </Button>
        </Card>
      )}
    </div>
  );
}
