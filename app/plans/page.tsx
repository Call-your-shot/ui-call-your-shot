"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProgressRing from "@/components/ui/ProgressRing";
import HouseIllustration from "@/components/civic/HouseIllustration";
import { useDemo } from "@/lib/demo-context";
import { useSignedInEmail } from "@/lib/session";
import { formatPropertyAddress, type TenancyStatus } from "@/lib/accounts";
import type { Address } from "@/lib/mockData";
import type { PlanListItem, PlansApiResponse } from "@/app/api/plans/route";
import { cn } from "@/lib/utils";
import { NEW_ASSESSMENT_HREF } from "@/lib/billFlow";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v);
}

function tenancyToPlanListItem(t: {
  id: string;
  status: TenancyStatus;
  address: Address;
  imageVariant: number;
  landlordName: string;
  balanceRepaid: number;
  balanceTotal: number;
  monthly: { month: string; savingsDollars: number }[];
}): PlanListItem {
  const lastMonth = t.monthly[t.monthly.length - 1];
  return {
    id: t.id,
    status: t.status,
    address: t.address,
    imageVariant: t.imageVariant,
    landlordName: t.landlordName,
    balanceRepaid: t.balanceRepaid,
    balanceTotal: t.balanceTotal,
    lastMonth: lastMonth ? { month: lastMonth.month, savingsDollars: lastMonth.savingsDollars } : null,
  };
}

const statusLabel: Record<TenancyStatus, string> = {
  no_solar: "No solar yet",
  proposal_sent: "Proposal sent",
  awaiting_landlord: "Awaiting landlord",
  active: "Active",
  leaving: "Leaving",
  ended: "Ended",
};

const statusClasses: Record<TenancyStatus, string> = {
  no_solar: "bg-grey-200 text-grey-600",
  proposal_sent: "bg-info-light text-info",
  awaiting_landlord: "bg-warning-light text-warning",
  active: "bg-success-light text-success",
  leaving: "bg-warning-light text-warning",
  ended: "bg-grey-200 text-grey-600",
};

export default function PlansPage() {
  const { account } = useDemo();
  const signedInEmail = useSignedInEmail();
  const [remotePlans, setRemotePlans] = useState<PlanListItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Nothing to fetch in demo mode — the render below only reads
    // `remotePlans` when `signedInEmail` is set, so there's no stale state
    // to clear here.
    if (!signedInEmail) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starts the loading flag for the fetch kicked off right below
    setLoading(true);
    fetch(`/api/plans?email=${encodeURIComponent(signedInEmail)}`)
      .then((res) => res.json())
      .then((data: PlansApiResponse) => {
        if (!cancelled) setRemotePlans(data.plans ?? []);
      })
      .catch(() => {
        if (!cancelled) setRemotePlans([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signedInEmail]);

  // Signed in: pulled live from the backend via /api/plans (empty while
  // the fetch is in flight). Demo mode (no signed-in email): the local
  // mock account, matching the existing account-switcher demo panel.
  const plans: PlanListItem[] = signedInEmail
    ? (remotePlans ?? [])
    : account.tenancies.map(tenancyToPlanListItem);
  const stillLoading = Boolean(signedInEmail) && loading && remotePlans === null;

  return (
    <div>
      <h1 className="text-h1">My plans</h1>
      <p className="text-body mt-1">Every property you rent, and how solar is going there.</p>

      {stillLoading ? (
        <Card className="mt-6 flex items-center justify-center py-10">
          <p className="text-body">Loading your plans…</p>
        </Card>
      ) : plans.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {plans.map((p) => (
            <PlanRow key={p.id} plan={p} />
          ))}
        </div>
      )}

      <Button href={NEW_ASSESSMENT_HREF} fullWidth className="mt-6">
        <Plus size={16} aria-hidden="true" />
        Start a new assessment
      </Button>
    </div>
  );
}

function PlanRow({ plan }: { plan: PlanListItem }) {
  const percentRepaid =
    plan.balanceTotal > 0 ? Math.round((plan.balanceRepaid / plan.balanceTotal) * 100) : 0;

  const href =
    plan.status === "proposal_sent" || plan.status === "awaiting_landlord"
      ? `/proposal/${plan.id}`
      : `/plans/${plan.id}`;

  return (
    <Link href={href}>
      <Card className="flex items-stretch gap-4 p-4">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg">
          <HouseIllustration variant={plan.imageVariant} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-1">
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex h-6 items-center rounded-md px-2 text-[12px] font-bold", statusClasses[plan.status])}>
              {statusLabel[plan.status]}
            </span>
          </div>
          <p className="text-h3 truncate">{formatPropertyAddress(plan.address)}</p>
          {plan.status === "active" && plan.lastMonth ? (
            <p className="text-small">
              Saving {formatCurrency(plan.lastMonth.savingsDollars)}/month · next statement 1{" "}
              {new Date().toLocaleDateString("en-AU", { month: "short" })}
            </p>
          ) : (
            <p className="text-small">{plan.landlordName}</p>
          )}
        </div>
        {plan.status === "active" && (
          <div className="hidden shrink-0 items-center sm:flex">
            <ProgressRing percent={percentRepaid} size={56} strokeWidth={6}>
              <span className="text-[13px] font-bold tabular-nums">{percentRepaid}%</span>
            </ProgressRing>
          </div>
        )}
        <ChevronRight size={18} className="my-auto shrink-0 text-grey-400" aria-hidden="true" />
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <Card className="mt-6 flex flex-col items-center py-10 text-center">
      <p className="text-h3">You don&apos;t rent any properties with CYS Solar yet</p>
      <p className="text-body mt-1 max-w-sm">
        Start with the property address and we&apos;ll see whether your roof — or your landlord&apos;s — could work.
      </p>
      <Button href={NEW_ASSESSMENT_HREF} className="mt-5">
        Start an assessment
      </Button>
    </Card>
  );
}
