import { NextRequest, NextResponse } from "next/server";
import type { PlanDetailResponse } from "@/app/api/plans/[id]/route";

export interface CreateLeaveRequestInput {
  email: string;
  moveOutDate: string;
  reason: string;
  note?: string;
}

export interface LeaveRequestApiSuccess {
  ok: true;
  plan: PlanDetailResponse;
}

export interface LeaveRequestApiError {
  ok: false;
  message: string;
}

export type LeaveRequestApiResponse = LeaveRequestApiSuccess | LeaveRequestApiError;

// Proxies to the real backend's POST /api/plans/{id}/leave — sets the
// plan (and its linked property) to "leaving", records the notice, and
// notifies the landlord. No local fallback: this mutates a real resource,
// same reasoning as /api/create-proposal.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: CreateLeaveRequestInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<LeaveRequestApiResponse>(
      { ok: false, message: "Malformed request body" },
      { status: 400 }
    );
  }

  const backendBaseUrl = process.env.BACKEND_URL;
  if (!backendBaseUrl) {
    return NextResponse.json<LeaveRequestApiResponse>(
      { ok: false, message: "Leave requests aren't configured yet — BACKEND_URL is unset." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${backendBaseUrl}/api/plans/${encodeURIComponent(id)}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      const message = typeof data?.detail === "string" ? data.detail : `Leave request backend responded ${res.status}`;
      return NextResponse.json<LeaveRequestApiResponse>({ ok: false, message }, { status: res.status });
    }
    return NextResponse.json<LeaveRequestApiResponse>({ ok: true, plan: data as PlanDetailResponse });
  } catch (err) {
    console.error("[api/plans/[id]/leave] backend call failed:", err);
    return NextResponse.json<LeaveRequestApiResponse>(
      { ok: false, message: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 }
    );
  }
}
