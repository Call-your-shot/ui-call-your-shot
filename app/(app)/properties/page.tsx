"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import HouseIllustration from "@/components/civic/HouseIllustration";
import { useDemo } from "@/lib/demo-context";
import { formatPropertyAddress, type OwnedProperty } from "@/lib/accounts";
import { cn } from "@/lib/utils";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v);
}

const occupancyLabel: Record<OwnedProperty["occupancyStatus"], string> = {
  occupied: "Occupied",
  vacant: "Vacant",
  pending_invitation: "Invitation pending",
};

const occupancyClasses: Record<OwnedProperty["occupancyStatus"], string> = {
  occupied: "bg-success-light text-success",
  vacant: "bg-grey-200 text-grey-600",
  pending_invitation: "bg-warning-light text-warning",
};

export default function PropertiesPage() {
  const { account } = useDemo();

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-h1">My properties</h1>
          <p className="text-body mt-1">Every property you lease out with SunShare.</p>
        </div>
        <Button href="/properties/new" className="hidden sm:inline-flex">
          <Plus size={16} aria-hidden="true" />
          Add property
        </Button>
      </div>

      {account.ownedProperties.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {account.ownedProperties.map((p) => (
            <PropertyRow key={p.id} property={p} />
          ))}
        </div>
      )}

      <Button href="/properties/new" fullWidth className="mt-6 sm:hidden">
        <Plus size={16} aria-hidden="true" />
        Add property
      </Button>
    </div>
  );
}

function PropertyRow({ property }: { property: OwnedProperty }) {
  return (
    <Link href={`/properties/${property.id}`}>
      <Card className="flex items-stretch gap-4 p-4">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg">
          <HouseIllustration variant={property.imageVariant} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-1">
          <span
            className={cn(
              "inline-flex h-6 w-fit items-center rounded-md px-2 text-[12px] font-bold",
              occupancyClasses[property.occupancyStatus]
            )}
          >
            {occupancyLabel[property.occupancyStatus]}
          </span>
          <p className="text-h3 truncate">{formatPropertyAddress(property.address)}</p>
          <p className="text-small">
            {property.system ? `${property.system.sizeKw} kW system` : "No system yet"}
            {property.currentTenant ? ` · ${property.currentTenant.name}` : ""}
          </p>
        </div>
        <div className="hidden shrink-0 flex-col items-end justify-center gap-0.5 sm:flex">
          <p className="text-[15px] font-bold tabular-nums">{formatCurrency(property.monthlyIncome)}/mo</p>
          <p className="text-small">{formatCurrency(property.balanceOutstanding)} outstanding</p>
        </div>
        <ChevronRight size={18} className="my-auto shrink-0 text-grey-400" aria-hidden="true" />
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <Card className="mt-6 flex flex-col items-center py-10 text-center">
      <p className="text-h3">You don&apos;t lease out any properties yet</p>
      <p className="text-body mt-1 max-w-sm">
        Add a rental property and we&apos;ll check what a solar sharing plan could earn you.
      </p>
      <Button href="/properties/new" className="mt-5">
        Add property
      </Button>
    </Card>
  );
}
