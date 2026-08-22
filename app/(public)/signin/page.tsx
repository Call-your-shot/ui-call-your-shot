"use client";

import Button from "@/components/ui/Button";
import Logo from "@/components/civic/Logo";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function handleSend() {
    if (!email) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 700);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-14">
      <Logo size={40} />

      {!sent ? (
        <>
          <h1 className="text-h1 mt-6 text-ink">Sign in to SunShare</h1>
          <p className="text-body mt-2 text-muted">
            We&apos;ll email you a magic link — no password needed.
          </p>

          <div className="mt-8">
            <label
              htmlFor="email"
              className="mb-1.5 block text-[14px] font-semibold text-ink"
            >
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
            <Button onClick={handleSend} disabled={!email || sending} fullWidth>
              {sending ? "Sending…" : "Send magic link"}
            </Button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="py-2 text-center text-small font-medium text-primary underline underline-offset-2"
            >
              Skip — demo mode
            </button>
          </div>
        </>
      ) : (
        <div className="mt-10 flex flex-1 flex-col items-center text-center animate-fade-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
            <Mail size={26} className="text-success" aria-hidden="true" />
          </div>
          <h1 className="text-h1 mt-5 text-ink">Check your email</h1>
          <p className="text-body mt-2 max-w-[26rem] text-muted">
            We sent a sign-in link to{" "}
            <span className="font-semibold text-ink">{email}</span>. Click
            it to continue.
          </p>

          <div className="mt-8 w-full">
            <Button onClick={() => router.push("/dashboard")} fullWidth>
              Continue (demo)
            </Button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mt-3 w-full py-2 text-center text-small font-medium text-primary underline underline-offset-2"
            >
              Skip — demo mode
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
