import { NextRequest, NextResponse } from "next/server";
import { getAccountByEmail, type OwnedProperty } from "@/lib/accounts";
import type { Address } from "@/lib/mockData";

export interface PropertyListItem {
  id: string;
  address: Address;
  imageVariant: number;
  occupancyStatus: OwnedProperty["occupancyStatus"];
  systemSizeKw: number | null;
  currentTenantName: string | null;
  monthlyIncome: number;
  balanceOutstanding: number;
}

export interface PropertiesApiResponse {
  properties: PropertyListItem[];
}

function localProperties(email: string): PropertiesApiResponse {
  const account = getAccountByEmail(email);
  const properties: PropertyListItem[] = (account?.ownedProperties ?? []).map((p) => ({
    id: p.id,
    address: p.address,
    imageVariant: p.imageVariant,
    occupancyStatus: p.occupancyStatus,
    systemSizeKw: p.system?.sizeKw ?? null,
    currentTenantName: p.currentTenant?.name ?? null,
    monthlyIncome: p.monthlyIncome,
    balanceOutstanding: p.balanceOutstanding,
  }));
  return { properties };
}

// Same proxy-first, local-fallback pattern as GET /api/plans — the real
// backend already exposes this at GET /api/properties?email= (in
// energy.py, reusing plan_views.list_landlord_properties), so this just
// mirrors the plans route's shape for the Next.js frontend.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ message: "email is required" }, { status: 400 });
  }

  const backendBaseUrl = process.env.BACKEND_URL;
  if (backendBaseUrl) {
    try {
      const res = await fetch(`${backendBaseUrl}/api/properties?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error(`Properties backend responded ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data?.properties)) throw new Error("Properties backend returned no usable properties array");
      return NextResponse.json<PropertiesApiResponse>({ properties: data.properties });
    } catch (err) {
      console.error("[api/properties] backend call failed, using local fallback:", err);
    }
  }

  return NextResponse.json<PropertiesApiResponse>(localProperties(email));
}
