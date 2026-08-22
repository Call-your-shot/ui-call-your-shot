import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/solar/googleClient";

export interface AddressApiResponse {
  ok: boolean;
  formattedAddress?: string;
  message?: string;
}

interface AddressRequestBody {
  address?: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  let body: AddressRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<AddressApiResponse>(
      { ok: false, message: "Malformed request body" },
      { status: 400 }
    );
  }

  if (!body.address?.trim()) {
    return NextResponse.json<AddressApiResponse>(
      { ok: false, message: "Enter an address" },
      { status: 400 }
    );
  }

  // No key configured — accept anything non-empty rather than block the
  // whole flow on a missing dev credential.
  if (!apiKey) {
    return NextResponse.json<AddressApiResponse>({ ok: true, formattedAddress: body.address.trim() });
  }

  try {
    const geocoded = await geocodeAddress(body.address, apiKey);
    if (!geocoded) {
      return NextResponse.json<AddressApiResponse>({
        ok: false,
        message: "We couldn't find that address — check it and try again.",
      });
    }
    return NextResponse.json<AddressApiResponse>({ ok: true, formattedAddress: geocoded.formattedAddress });
  } catch (err) {
    console.error("[api/address] geocode failed:", err);
    // Don't block the flow on a transient geocoding failure.
    return NextResponse.json<AddressApiResponse>({ ok: true, formattedAddress: body.address.trim() });
  }
}
