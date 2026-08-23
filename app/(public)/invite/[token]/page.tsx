"use client";

import Button from "@/components/ui/Button";
import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import Logo from "@/components/civic/Logo";
import { setSignedInEmail } from "@/lib/session";
import type { GetProposalApiResponse } from "@/app/api/proposals/[token]/route";
import type { AcceptProposalApiResponse } from "@/app/api/proposals/[token]/accept/route";
import type { ProposalResponse } from "@/app/api/create-proposal/route";
import { Check, Loader2, Mail, User, Zap } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; proposal: ProposalResponse };

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v);
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [landlordName, setLandlordName] = useState("");
  const [landlordEmail, setLandlordEmail] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/proposals/${params.token}`)
      .then((res) => res.json())
      .then((data: GetProposalApiResponse) => {
        if (cancelled) return;
        if (data.ok) {
          setState({ kind: "ready", proposal: data.proposal });
        } else {
          setState({ kind: "error", message: data.message });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error", message: "Couldn't reach the server — check your connection and try again." });
      });
    return () => {
      cancelled = true;
    };
  }, [params.token]);

  async function acceptInvite() {
    if (!landlordName.trim() || !landlordEmail.trim()) return;
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await fetch(`/api/proposals/${params.token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landlordName: landlordName.trim(), landlordEmail: landlordEmail.trim() }),
      });
      const data = (await res.json()) as AcceptProposalApiResponse;
      if (!data.ok) {
        setAcceptError(data.message);
        return;
      }
      setSignedInEmail(landlordEmail.trim());
      setAccepted(true);
    } catch {
      setAcceptError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-14">
      <Logo size={40} />

      {state.kind === "loading" && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <Loader2 size={28} className="animate-spin text-primary" aria-hidden="true" />
          <p className="text-body">Loading the proposal…</p>
        </div>
      )}

      {state.kind === "error" && (
        <div className="mt-8">
          <Callout variant="warning" heading="Couldn't load this invite">
            {state.message}
          </Callout>
        </div>
      )}

      {state.kind === "ready" && !accepted && (
        <>
          <h1 className="text-h1 mt-6 text-ink">
            {state.proposal.tenant.name} wants to share solar with you
          </h1>
          <p className="text-body mt-2 text-muted">
            {state.proposal.property.name as string}
          </p>

          <Card className="mt-6">
            <div className="flex items-center gap-2 text-primary">
              <Zap size={16} aria-hidden="true" />
              <p className="text-[13px] font-semibold tracking-wide uppercase">Proposed system</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-data">{state.proposal.system.systemSizeKw}</p>
                <p className="text-small">kW system</p>
              </div>
              <div>
                <p className="text-data">{state.proposal.system.panelCount}</p>
                <p className="text-small">Panels</p>
              </div>
              <div>
                <p className="text-data">
                  {formatCurrency(Number(state.proposal.financialSummary.estimatedAnnualSavings ?? 0))}
                </p>
                <p className="text-small">Est. tenant savings/yr</p>
              </div>
            </div>
          </Card>

          {state.proposal.status === "accepted" ? (
            <div className="mt-6">
              <Callout variant="info">
                This proposal has already been accepted. Sign in with the email you used to view it.
              </Callout>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-body text-muted">
                Sign up (or log in) to review and accept — no password needed.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <div>
                  <label htmlFor="landlordName" className="mb-1.5 block text-[14px] font-semibold text-ink">
                    Your name
                  </label>
                  <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-3.5 focus-within:border-primary">
                    <User size={18} className="shrink-0 text-muted" aria-hidden="true" />
                    <input
                      id="landlordName"
                      type="text"
                      placeholder="Jane Smith"
                      value={landlordName}
                      onChange={(e) => setLandlordName(e.target.value)}
                      className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="landlordEmail" className="mb-1.5 block text-[14px] font-semibold text-ink">
                    Email address
                  </label>
                  <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-3.5 focus-within:border-primary">
                    <Mail size={18} className="shrink-0 text-muted" aria-hidden="true" />
                    <input
                      id="landlordEmail"
                      type="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      value={landlordEmail}
                      onChange={(e) => setLandlordEmail(e.target.value)}
                      className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
                    />
                  </div>
                </div>
              </div>

              {acceptError && (
                <div className="mt-4">
                  <Callout variant="warning">{acceptError}</Callout>
                </div>
              )}

              <Button
                className="mt-6"
                fullWidth
                disabled={!landlordName.trim() || !landlordEmail.trim() || accepting}
                onClick={acceptInvite}
              >
                {accepting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    Accepting…
                  </>
                ) : (
                  "Accept & sign up"
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {accepted && (
        <Card className="mt-8 flex flex-col items-center gap-3 bg-primary-light/5 text-center" accent="primary">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
            <Check size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-ink">Proposal accepted</p>
            <p className="text-small mt-1 text-muted">
              Your new property is ready — you and your tenant can both track it from here.
            </p>
          </div>
          <Button fullWidth onClick={() => router.push("/properties")}>
            View my properties
          </Button>
        </Card>
      )}
    </div>
  );
}
