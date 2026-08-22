import { NextRequest, NextResponse } from "next/server";
import { findTenancyById } from "@/lib/accounts";

function localPlan(id: string) {
  const tenancy = findTenancyById(id);
  return tenancy ? { ...tenancy, leaveRequest: tenancy.leaveRequest ?? null } : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = req.nextUrl.searchParams.get("email")?.trim();

  // Same proxy-first, local-fallback pattern as GET /api/plans — see there
  // for why. Any backend failure (network error or non-2xx) falls through
  // to the local mock lookup rather than surfacing an error.
  const backendBaseUrl = process.env.BACKEND_URL;
  if (backendBaseUrl) {
    try {
      const url = new URL(`${backendBaseUrl}/api/plans/${encodeURIComponent(id)}`);
      if (email) url.searchParams.set("email", email);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Plans backend responded ${res.status}`);
      return NextResponse.json(await res.json());
    } catch (err) {
      console.error("[api/plans/[id]] backend call failed, using local fallback:", err);
    }
  }

  const plan = localPlan(id);
  if (!plan) {
    return NextResponse.json({ message: "Plan not found" }, { status: 404 });
  }
  return NextResponse.json(plan);
}
