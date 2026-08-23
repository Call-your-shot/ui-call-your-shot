"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import HouseIllustration from "@/components/civic/HouseIllustration";
import { useDemo } from "@/lib/demo-context";
import { useSignedInEmail } from "@/lib/session";
import { type OwnedProperty } from "@/lib/accounts";
import { formatAddress } from "@/lib/mockData";
import type { PropertiesApiResponse, PropertyListItem } from "@/app/api/properties/route";
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

function ownedPropertyToListItem(p: OwnedProperty): PropertyListItem {
  return {
    id: p.id,
    address: p.address,
    imageVariant: p.imageVariant,
    occupancyStatus: p.occupancyStatus,
    systemSizeKw: p.system?.sizeKw ?? null,
    currentTenantName: p.currentTenant?.name ?? null,
    monthlyIncome: p.monthlyIncome,
    balanceOutstanding: p.balanceOutstanding,
  };
}

export default function PropertiesPage() {
  const { account } = useDemo();
  const signedInEmail = useSignedInEmail();
  const [remoteProperties, setRemoteProperties] = useState<PropertyListItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Nothing to fetch in demo mode — the render below only reads
    // `remoteProperties` when `signedInEmail` is set, so there's no stale
    // state to clear here.
    if (!signedInEmail) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starts the loading flag for the fetch kicked off right below
    setLoading(true);
    fetch(`/api/properties?email=${encodeURIComponent(signedInEmail)}`)
      .then((res) => res.json())
      .then((data: PropertiesApiResponse) => {
        if (!cancelled) setRemoteProperties(data.properties ?? []);
      })
      .catch(() => {
        if (!cancelled) setRemoteProperties([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signedInEmail]);

  // Signed in: pulled live from the backend via /api/properties (empty
  // while the fetch is in flight). Demo mode (no signed-in email): the
  // local mock account, matching the existing account-switcher demo panel.
  const properties: PropertyListItem[] = signedInEmail
    ? (remoteProperties ?? [])
    : account.ownedProperties.map(ownedPropertyToListItem);
  const stillLoading = Boolean(signedInEmail) && loading && remoteProperties === null;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-h1">My properties</h1>
          <p className="text-body mt-1">Every property you lease out with CYS Solar.</p>
        </div>
        <Button href="/properties/new" className="hidden sm:inline-flex">
          <Plus size={16} aria-hidden="true" />
          Add property
        </Button>
      </div>

      {stillLoading ? (
        <Card className="mt-6 flex items-center justify-center py-10">
          <p className="text-body">Loading your properties…</p>
        </Card>
      ) : properties.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {properties.map((p) => (
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

function PropertyRow({ property }: { property: PropertyListItem }) {
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
          <p className="text-h3 truncate">{formatAddress(property.address)}</p>
          <p className="text-small">
            {property.systemSizeKw != null ? `${property.systemSizeKw} kW system` : "No system yet"}
            {property.currentTenantName ? ` · ${property.currentTenantName}` : ""}
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
