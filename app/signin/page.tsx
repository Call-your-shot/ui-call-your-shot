"use client";

import Button from "@/components/ui/Button";
import Logo from "@/components/civic/Logo";
import type { SignInApiResponse } from "@/app/api/signin/route";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function signIn(targetEmail: string) {
    if (!targetEmail) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = (await res.json()) as SignInApiResponse;
      if (!res.ok || !data.ok) throw new Error(data.message ?? "Sign in failed");
      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign in failed");
    } finally {
      setSending(false);
    }
  }

  async function handleContinue() {
    await signIn(email);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-14">
      <Logo size={40} />

      <h1 className="text-h1 mt-6 text-ink">Sign in to CYS Solar</h1>
      <p className="text-body mt-2 text-muted">
        Enter your email to continue — no password needed.
      </p>

      <div className="mt-8">
        <label htmlFor="email" className="mb-1.5 block text-[14px] font-semibold text-ink">
          Email address
        </label>
        <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-3.5 focus-within:border-primary">
          <Mail size={18} className="shrink-0 text-muted" aria-hidden="true" />
          <input
            id="email"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button onClick={handleContinue} disabled={!email || sending} fullWidth>
          {sending ? "Continuing…" : "Continue"}
        </Button>
        <button
          type="button"
          onClick={() => signIn("priya.nair@example.com")}
          disabled={sending}
          className="py-2 text-center text-small font-medium text-primary underline underline-offset-2"
        >
          Skip — demo mode
        </button>
        {error && <p className="text-small text-error" role="alert">{error}</p>}
      </div>
    </div>
  );
}
