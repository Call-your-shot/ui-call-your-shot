import { NextRequest, NextResponse } from "next/server";
import type { ProposalResponse } from "@/app/api/create-proposal/route";

export interface GetProposalApiSuccess {
  ok: true;
  proposal: ProposalResponse;
}

export interface GetProposalApiError {
  ok: false;
  message: string;
}

export type GetProposalApiResponse = GetProposalApiSuccess | GetProposalApiError;

// Proxies to the real backend's GET /proposals/{id_or_token} — powers the
// public /invite/[token] page, which shows the landlord what they're
// accepting before they sign up. No local fallback: same reasoning as
// /api/create-proposal, this is a real resource lookup.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const backendBaseUrl = process.env.BACKEND_URL;
  if (!backendBaseUrl) {
    return NextResponse.json<GetProposalApiResponse>(
      { ok: false, message: "Proposals aren't configured yet — BACKEND_URL is unset." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${backendBaseUrl}/proposals/${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!res.ok) {
      const message = typeof data?.detail === "string" ? data.detail : `Proposal backend responded ${res.status}`;
      return NextResponse.json<GetProposalApiResponse>({ ok: false, message }, { status: res.status });
    }
    return NextResponse.json<GetProposalApiResponse>({ ok: true, proposal: data as ProposalResponse });
  } catch (err) {
    console.error("[api/proposals/[token]] backend call failed:", err);
    return NextResponse.json<GetProposalApiResponse>(
      { ok: false, message: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 }
    );
  }
}
