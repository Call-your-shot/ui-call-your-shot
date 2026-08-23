"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProgressRing from "@/components/ui/ProgressRing";
import HouseIllustration from "@/components/civic/HouseIllustration";
import { useDemo } from "@/lib/demo-context";
import { formatPropertyAddress, type Tenancy, type TenancyStatus } from "@/lib/accounts";
import { cn } from "@/lib/utils";
import { NEW_ASSESSMENT_HREF } from "@/lib/billFlow";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v);
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

  return (
    <div>
      <h1 className="text-h1">My plans</h1>
      <p className="text-body mt-1">Every property you rent, and how solar is going there.</p>

      {account.tenancies.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {account.tenancies.map((t) => (
            <PlanRow key={t.id} tenancy={t} />
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

function PlanRow({ tenancy }: { tenancy: Tenancy }) {
  const percentRepaid =
    tenancy.balanceTotal > 0 ? Math.round((tenancy.balanceRepaid / tenancy.balanceTotal) * 100) : 0;
  const lastMonth = tenancy.monthly[tenancy.monthly.length - 1];

  const href =
    tenancy.status === "proposal_sent" || tenancy.status === "awaiting_landlord"
      ? `/proposal/${tenancy.id}`
      : `/plans/${tenancy.id}`;

  return (
    <Link href={href}>
      <Card className="flex items-stretch gap-4 p-4">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg">
          <HouseIllustration variant={tenancy.imageVariant} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-1">
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex h-6 items-center rounded-md px-2 text-[12px] font-bold", statusClasses[tenancy.status])}>
              {statusLabel[tenancy.status]}
            </span>
          </div>
          <p className="text-h3 truncate">{formatPropertyAddress(tenancy.address)}</p>
          {tenancy.status === "active" && lastMonth ? (
            <p className="text-small">
              Saving {formatCurrency(lastMonth.savingsDollars)}/month · next statement 1{" "}
              {new Date().toLocaleDateString("en-AU", { month: "short" })}
            </p>
          ) : (
            <p className="text-small">{tenancy.landlordName}</p>
          )}
        </div>
        {tenancy.status === "active" && (
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
      <p className="text-h3">You don&apos;t rent any properties with SunShare yet</p>
      <p className="text-body mt-1 max-w-sm">
        Start with the property address and we&apos;ll see whether your roof — or your landlord&apos;s — could work.
      </p>
      <Button href={NEW_ASSESSMENT_HREF} className="mt-5">
        Start an assessment
      </Button>
    </Card>
  );
}
