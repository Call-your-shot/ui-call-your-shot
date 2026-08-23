"use client";

import Logo from "@/components/civic/Logo";
import StepIndicator from "@/components/ui/StepIndicator";
import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const FLOW_STEPS = [
  { path: "/scan", label: "Scan bill" },
  { path: "/household", label: "Household" },
  { path: "/roof", label: "Your roof" },
  { path: "/results", label: "Results" },
];

export default function FocusedHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const currentIndex = Math.max(
    0,
    FLOW_STEPS.findIndex((s) => pathname.startsWith(s.path))
  );

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex shrink-0 items-center gap-2">
            <Logo size={26} />
            <span className="hidden text-[16px] font-bold text-primary sm:inline">
              CYS Solar
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <StepIndicator
              steps={FLOW_STEPS.map((s) => s.label)}
              current={currentIndex}
            />
          </div>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            aria-label="Exit assessment"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-alt hover:text-ink"
          >
            <X size={22} />
          </button>
        </div>
      </header>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-dialog-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-primary-dark/50 p-4 sm:items-center"
        >
          <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-6 shadow-xl animate-fade-up">
            <h2 id="exit-dialog-title" className="text-h3 text-ink">
              Exit this assessment?
            </h2>
            <p className="text-small mt-2 text-muted">
              Your progress on this step won&apos;t be saved. You can start a
              new assessment any time from your dashboard.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="min-h-11 flex-1 rounded-lg bg-primary px-4 text-[15px] font-semibold text-white hover:bg-primary-dark"
              >
                Exit to dashboard
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="min-h-11 flex-1 rounded-lg border-2 border-primary px-4 text-[15px] font-semibold text-primary hover:bg-surface-alt"
              >
                Keep going
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
