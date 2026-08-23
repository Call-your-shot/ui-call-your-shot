import { NextRequest, NextResponse } from "next/server";
import type { PropertyDetailResponse } from "@/app/api/properties/[id]/route";

export interface ApproveLeaveRequestInput {
  email: string;
}

export interface ApproveLeaveRequestApiSuccess {
  ok: true;
  property: PropertyDetailResponse;
}

export interface ApproveLeaveRequestApiError {
  ok: false;
  message: string;
}

export type ApproveLeaveRequestApiResponse = ApproveLeaveRequestApiSuccess | ApproveLeaveRequestApiError;

// Proxies to the real backend's POST /api/properties/{id}/leave-request/approve
// — closes out the plan on the tenant's side (status -> "ended", severing
// the tenant/landlord link) and notifies the tenant. No local fallback,
// same reasoning as /api/plans/[id]/leave.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: ApproveLeaveRequestInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApproveLeaveRequestApiResponse>(
      { ok: false, message: "Malformed request body" },
      { status: 400 }
    );
  }

  const backendBaseUrl = process.env.BACKEND_URL;
  if (!backendBaseUrl) {
    return NextResponse.json<ApproveLeaveRequestApiResponse>(
      { ok: false, message: "Leave requests aren't configured yet — BACKEND_URL is unset." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${backendBaseUrl}/api/properties/${encodeURIComponent(id)}/leave-request/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      const message = typeof data?.detail === "string" ? data.detail : `Leave request backend responded ${res.status}`;
      return NextResponse.json<ApproveLeaveRequestApiResponse>({ ok: false, message }, { status: res.status });
    }
    return NextResponse.json<ApproveLeaveRequestApiResponse>({ ok: true, property: data as PropertyDetailResponse });
  } catch (err) {
    console.error("[api/properties/[id]/leave-request/approve] backend call failed:", err);
    return NextResponse.json<ApproveLeaveRequestApiResponse>(
      { ok: false, message: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 }
    );
  }
}
