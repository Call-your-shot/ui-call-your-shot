"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Callout from "@/components/ui/Callout";
import { useDemo } from "@/lib/demo-context";
import { useSignedInEmail } from "@/lib/session";
import { formatPropertyAddress, getTenancy } from "@/lib/accounts";
import { formatDate } from "@/lib/mockData";
import type { PlanDetailResponse } from "@/app/api/plans/[id]/route";
import type { LeaveRequestApiResponse } from "@/app/api/plans/[id]/leave/route";
import { cn } from "@/lib/utils";
import { Check, CircleDot, Loader2 } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v);
}

const REASONS = [
  { value: "work", label: "Moving for work" },
  { value: "rent", label: "Rent increase" },
  { value: "property", label: "Property issue" },
  { value: "lease_end", label: "End of lease" },
  { value: "other", label: "Other" },
];

export default function LeavePlanPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { account, hydrated, refresh } = useDemo();
  const signedInEmail = useSignedInEmail();
  const localTenancy = getTenancy(account, params.id);
  const [remotePlan, setRemotePlan] = useState<PlanDetailResponse | null>(null);
  const [remoteChecked, setRemoteChecked] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [moveOutDate, setMoveOutDate] = useState("");
  const [reason, setReason] = useState(REASONS[0].value);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    // Nothing to fetch in demo mode — the render below only reads
    // `remotePlan`/`remoteChecked` when `signedInEmail` is set, so there's
    // no stale state to clear here.
    if (!signedInEmail) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starts the loading flag for the fetch kicked off right below
    setRemoteChecked(false);
    fetch(`/api/plans/${params.id}?email=${encodeURIComponent(signedInEmail)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PlanDetailResponse | null) => {
        if (!cancelled) setRemotePlan(data);
      })
      .catch(() => {
        if (!cancelled) setRemotePlan(null);
      })
      .finally(() => {
        if (!cancelled) setRemoteChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [signedInEmail, params.id]);

  // Signed in: pulled live from the backend via /api/plans/[id]. Demo mode
  // (no signed-in email): the local mock account, matching the existing
  // account-switcher demo panel.
  const tenancy: PlanDetailResponse | undefined = signedInEmail
    ? (remotePlan ?? undefined)
    : localTenancy
      ? { ...localTenancy, leaveRequest: localTenancy.leaveRequest ?? null }
      : undefined;

  // Jump straight to the status view if a notice is already on file — only
  // fires once real data settles (demo mode has it on the first render, but
  // the effect only actually moves the step when it's not already there).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- jumps to the status view once a leave request is confirmed to exist, from either data source
    if (tenancy?.leaveRequest && step !== 4) setStep(4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenancy?.leaveRequest]);

  // See the matching guard in plans/[id]/page.tsx for why this waits on
  // `hydrated` before treating a miss as a real 404.
  if (!hydrated) return null;
  if (signedInEmail && !remoteChecked) return null;
  if (!tenancy) return notFound();

  async function submit() {
    if (!tenancy || !moveOutDate) return;
    const reasonLabel = REASONS.find((r) => r.value === reason)?.label ?? reason;

    if (signedInEmail) {
      setSubmitError(null);
      setSubmitting(true);
      try {
        const res = await fetch(`/api/plans/${tenancy.id}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: signedInEmail, moveOutDate, reason: reasonLabel, note: note || undefined }),
        });
        const data = (await res.json()) as LeaveRequestApiResponse;
        if (!data.ok) {
          setSubmitError(data.message);
          return;
        }
        setRemotePlan(data.plan);
        setStep(4);
      } catch {
        setSubmitError("Couldn't reach the server — check your connection and try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Demo mode: `localTenancy` is a reference into the module-level mock
    // account store, not derived render state — there's no backend here,
    // so mutating it in place and calling refresh() to force a re-render is
    // the deliberate mechanism (see the `refresh` doc comment in
    // demo-context.tsx).
    if (!localTenancy) return;
    const today = new Date().toISOString().slice(0, 10);
    localTenancy.status = "leaving";
    localTenancy.leaveRequest = {
      requestedDate: today,
      moveOutDate,
      reason: reasonLabel,
      note: note || undefined,
      status: "pending",
      timeline: { noticeGiven: today },
    };
    refresh();
    setStep(4);
  }

  function withdraw() {
    // No backend endpoint to withdraw a submitted notice yet — the button
    // that calls this is hidden in signed-in mode (see below).
    if (!localTenancy) return;
    localTenancy.status = "active";
    localTenancy.leaveRequest = undefined;
    refresh();
    router.push(`/plans/${localTenancy.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-h1">Leave {formatPropertyAddress(tenancy.address)}</h1>

      {step === 1 && (
        <div className="mt-6 flex flex-col gap-6">
          <Callout variant="info" heading="This is a right, not a penalty">
            You can leave at any time. You will not owe anything. The remaining
            balance stays with the property and passes to the next tenant —
            not to you.
          </Callout>

          <Card>
            <h2 className="text-h3">Your contribution so far</h2>
            <p className="text-data mt-2 text-success">{formatCurrency(tenancy.balanceRepaid)}</p>
            <p className="text-small mt-1">
              This amount is retained by the property — it is not refunded to you,
              and you owe nothing further.
            </p>
          </Card>

          <div className="flex gap-3">
            <Button href={`/plans/${tenancy.id}`} variant="secondary" fullWidth>
              Cancel
            </Button>
            <Button fullWidth onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 flex flex-col gap-5">
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-semibold text-grey-900">
              Intended move-out date
            </span>
            <input
              type="date"
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-line bg-surface-alt px-3.5 py-2.5 text-[15px] outline-none focus:border-primary focus:bg-surface"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[14px] font-semibold text-grey-900">
              Reason (optional)
            </span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface-alt px-3.5 py-2.5 text-[15px] outline-none focus:border-primary focus:bg-surface"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[14px] font-semibold text-grey-900">
              Note (optional)
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-line bg-surface-alt px-3.5 py-2.5 text-[15px] outline-none focus:border-primary focus:bg-surface"
            />
          </label>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setStep(1)}>
              Back
            </Button>
            <Button fullWidth disabled={!moveOutDate} onClick={() => setStep(3)}>
              Review
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6 flex flex-col gap-6">
          <Card>
            <h2 className="text-h3">Review your notice</h2>
            <div className="mt-3 flex flex-col gap-2 text-[14px]">
              <SummaryRow label="Property" value={formatPropertyAddress(tenancy.address)} />
              <SummaryRow label="Move-out date" value={formatDate(moveOutDate)} />
              <SummaryRow label="Reason" value={REASONS.find((r) => r.value === reason)?.label ?? "—"} />
              {note && <SummaryRow label="Note" value={note} />}
            </div>
          </Card>
          <Callout variant="success">
            Once submitted, your landlord will be notified and your plan status
            will show as &ldquo;Leaving&rdquo;.
            {!signedInEmail && " You can withdraw your notice at any time before it's acknowledged."}
          </Callout>
          {submitError && <Callout variant="warning">{submitError}</Callout>}
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setStep(2)} disabled={submitting}>
              Back
            </Button>
            {/* `submit` mutates the mock tenancy record in place and calls
                refresh() to force a re-render in demo mode — deliberate,
                since there's no backend to call there (see the `refresh`
                doc comment in demo-context.tsx); signed-in mode posts to
                the real backend instead. */}
            {/* eslint-disable-next-line react-hooks/immutability */}
            <Button fullWidth disabled={submitting} onClick={submit}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Submitting…
                </>
              ) : (
                "Submit notice"
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 4 && tenancy.leaveRequest && (
        <div className="mt-6 flex flex-col gap-6">
          <Callout variant="info" heading="Notice given">
            Move-out date: {formatDate(tenancy.leaveRequest.moveOutDate)}
          </Callout>

          <Card>
            <h2 className="text-h3">Status</h2>
            <ol className="mt-4 flex flex-col gap-5">
              <TimelineStep
                label="Notice given"
                date={tenancy.leaveRequest.timeline.noticeGiven}
                done
              />
              <TimelineStep
                label="Landlord acknowledged"
                date={tenancy.leaveRequest.timeline.landlordAcknowledged}
                done={tenancy.leaveRequest.status !== "pending"}
              />
              <TimelineStep
                label="Final statement issued"
                date={tenancy.leaveRequest.timeline.finalStatementIssued}
                done={false}
              />
              <TimelineStep label="Plan closed" date={tenancy.leaveRequest.timeline.planClosed} done={false} />
            </ol>
          </Card>

          {/* No backend endpoint to withdraw a submitted notice yet — see
              the comment on `withdraw` above. */}
          {!signedInEmail && tenancy.leaveRequest.status === "pending" && (
              // eslint-disable-next-line react-hooks/immutability
              <Button variant="secondary" onClick={withdraw}>
                Withdraw notice
              </Button>
            )}
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed border-line pb-2 last:border-0">
      <span className="shrink-0 text-grey-600">{label}</span>
      <span className="text-right font-medium text-grey-900">{value}</span>
    </div>
  );
}

function TimelineStep({ label, date, done }: { label: string; date?: string; done: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
          done ? "bg-success text-white" : "bg-grey-200 text-grey-400"
        )}
      >
        {done ? <Check size={14} /> : <CircleDot size={14} />}
      </span>
      <div>
        <p className={cn("text-[14px] font-semibold", done ? "text-grey-900" : "text-grey-500")}>{label}</p>
        {date && <p className="text-small mt-0.5">{formatDate(date)}</p>}
      </div>
    </li>
  );
}
