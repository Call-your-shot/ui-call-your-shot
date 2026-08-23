import { NextRequest, NextResponse } from "next/server";
import type { ProposalResponse } from "@/app/api/create-proposal/route";

export interface AcceptProposalRequest {
  landlordName: string;
  landlordEmail: string;
}

export interface AcceptProposalApiSuccess {
  ok: true;
  proposal: ProposalResponse;
}

export interface AcceptProposalApiError {
  ok: false;
  message: string;
}

export type AcceptProposalApiResponse = AcceptProposalApiSuccess | AcceptProposalApiError;

// Proxies to the real backend's POST /proposals/{id_or_token}/accept — the
// landlord "signs up" for the invite here. On the backend this registers
// the landlord as a user, links them to the property, and (as of the
// backend's accept_proposal fix) synthesises the tenant's plan and the
// landlord's property so both sides immediately see it via the already-
// wired /api/plans and /api/properties.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let body: AcceptProposalRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<AcceptProposalApiResponse>(
      { ok: false, message: "Malformed request body" },
      { status: 400 }
    );
  }

  const backendBaseUrl = process.env.BACKEND_URL;
  if (!backendBaseUrl) {
    return NextResponse.json<AcceptProposalApiResponse>(
      { ok: false, message: "Proposals aren't configured yet — BACKEND_URL is unset." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${backendBaseUrl}/proposals/${encodeURIComponent(token)}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      const message = typeof data?.detail === "string" ? data.detail : `Proposal backend responded ${res.status}`;
      return NextResponse.json<AcceptProposalApiResponse>({ ok: false, message }, { status: res.status });
    }
    return NextResponse.json<AcceptProposalApiResponse>({ ok: true, proposal: data as ProposalResponse });
  } catch (err) {
    console.error("[api/proposals/[token]/accept] backend call failed:", err);
    return NextResponse.json<AcceptProposalApiResponse>(
      { ok: false, message: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 }
    );
  }
}
