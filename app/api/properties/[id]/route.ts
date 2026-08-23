import { NextRequest, NextResponse } from "next/server";
import { getOwnedProperty, getAccountByEmail, type OwnedProperty } from "@/lib/accounts";

export type PropertyDetailResponse = OwnedProperty;

function localProperty(id: string, email: string): PropertyDetailResponse | null {
  const account = getAccountByEmail(email);
  if (!account) return null;
  return getOwnedProperty(account, id) ?? null;
}

// Same proxy-first, local-fallback pattern as GET /api/plans/[id]. The real
// backend requires `email` to check ownership (get_landlord_property raises
// 403 for a non-owner), so it's required here too, unlike the plan detail
// route where it's optional.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = req.nextUrl.searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ message: "email is required" }, { status: 400 });
  }

  const backendBaseUrl = process.env.BACKEND_URL;
  if (backendBaseUrl) {
    try {
      const url = `${backendBaseUrl}/api/properties/${encodeURIComponent(id)}?email=${encodeURIComponent(email)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Properties backend responded ${res.status}`);
      return NextResponse.json(await res.json());
    } catch (err) {
      console.error("[api/properties/[id]] backend call failed, using local fallback:", err);
    }
  }

  const property = localProperty(id, email);
  if (!property) {
    return NextResponse.json({ message: "Property not found" }, { status: 404 });
  }
  return NextResponse.json(property);
}
