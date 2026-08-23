import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Proxies to the real backend's POST /create-proposal — see
// backend-call-your-shot/app/schemas/proposal.py and
// backend-call-your-shot/tests/test_proposals.py for the source of truth
// this mirrors. Unlike /api/annual-load or /api/plans, there's no local
// fallback: a proposal is a real resource the tenant/landlord then act on,
// so a backend that's unset or unreachable is a genuine error, not
// something to paper over with fabricated data.
// ---------------------------------------------------------------------------

export interface CreateProposalRequest {
  // The backend accepts either a free-text address or a structured one, but
  // every address in this app is already carried as a single formatted
  // string end-to-end (from Google geocoding or manual entry) — sending
  // that string is exactly what the backend's own test suite does, and
  // avoids a lossy string->{street,suburb,state,postcode} split here.
  address: string;

  tenant: {
    name: string;
    email: string;
  };

  system: {
    panelCount: number;
    systemSizeKw: number;
    panelWatts: number;
    orientation: string;
    pitchDegrees: number;
    estimatedAnnualAcKwh: number;
    source: "google" | "mock";
  };

  consumption: {
    billUsageKwh: number;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    estimatedAnnualKwh: number;
    ratePerKwhCents: number;
    rateSource: "bill" | "wollongong-default";
    recommendedSystemSizeKw: number;
    systemSizeSource: "backend" | "fallback";
  };
}

export interface ProposalResponse {
  id: string;
  propertyId: string;
  proposalType: string;
  title: string;
  description: string;
  status: string;
  inviteToken: string;
  inviteUrl: string;
  tenant: CreateProposalRequest["tenant"];
  system: CreateProposalRequest["system"];
  consumption: CreateProposalRequest["consumption"];
  financialSummary: Record<string, unknown>;
  property: Record<string, unknown>;
  createdAt: string;
}

export interface CreateProposalApiSuccess {
  ok: true;
  proposal: ProposalResponse;
}

export interface CreateProposalApiError {
  ok: false;
  message: string;
}

export type CreateProposalApiResponse = CreateProposalApiSuccess | CreateProposalApiError;

export async function POST(req: NextRequest) {
  let body: CreateProposalRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<CreateProposalApiResponse>(
      { ok: false, message: "Malformed request body" },
      { status: 400 }
    );
  }

  const backendBaseUrl = process.env.BACKEND_URL;
  if (!backendBaseUrl) {
    return NextResponse.json<CreateProposalApiResponse>(
      { ok: false, message: "Proposal creation isn't configured yet — BACKEND_URL is unset." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${backendBaseUrl}/create-proposal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      const message =
        typeof data?.detail === "string" ? data.detail : `Proposal backend responded ${res.status}`;
      return NextResponse.json<CreateProposalApiResponse>({ ok: false, message }, { status: res.status });
    }
    return NextResponse.json<CreateProposalApiResponse>({ ok: true, proposal: data as ProposalResponse });
  } catch (err) {
    console.error("[api/create-proposal] backend call failed:", err);
    return NextResponse.json<CreateProposalApiResponse>(
      { ok: false, message: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 }
    );
  }
}
