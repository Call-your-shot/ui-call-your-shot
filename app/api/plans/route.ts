import { NextRequest, NextResponse } from "next/server";
import { getAccountByEmail, type TenancyStatus } from "@/lib/accounts";
import type { Address } from "@/lib/mockData";

export interface PlanListItem {
  id: string;
  status: TenancyStatus;
  address: Address;
  imageVariant: number;
  landlordName: string;
  balanceRepaid: number;
  balanceTotal: number;
  lastMonth: { month: string; savingsDollars: number } | null;
}

export interface PlansApiResponse {
  plans: PlanListItem[];
}

function localPlans(email: string): PlansApiResponse {
  const account = getAccountByEmail(email);
  const plans: PlanListItem[] = (account?.tenancies ?? []).map((t) => {
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
  });
  return { plans };
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ message: "email is required" }, { status: 400 });
  }

  // BACKEND_URL now serves this same route directly — proxy to it and only
  // fall back to the local mock accounts if it's unset or unreachable, same
  // pattern as api/signin and api/annual-load. A successful-but-empty
  // backend response is trusted as-is (a real account can genuinely have no
  // plans), not treated as a failure worth falling back from.
  const backendBaseUrl = process.env.BACKEND_URL;
  if (backendBaseUrl) {
    try {
      const res = await fetch(`${backendBaseUrl}/api/plans?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error(`Plans backend responded ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data?.plans)) throw new Error("Plans backend returned no usable plans array");
      return NextResponse.json<PlansApiResponse>({ plans: data.plans });
    } catch (err) {
      console.error("[api/plans] backend call failed, using local fallback:", err);
    }
  }

  return NextResponse.json<PlansApiResponse>(localPlans(email));
}
