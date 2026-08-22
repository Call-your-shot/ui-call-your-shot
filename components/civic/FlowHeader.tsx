"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function FlowHeader({
  title,
  onBack,
  backHref,
  right,
  children,
}: {
  title: string;
  onBack?: () => void;
  backHref?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  const router = useRouter();

  function handleBack() {
    if (onBack) return onBack();
    if (backHref) return router.push(backHref);
    router.back();
  }

  return (
    <div className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-3 sm:px-6">
        <button
          type="button"
          onClick={handleBack}
          className="-ml-1 flex h-11 w-11 items-center justify-center rounded-full text-primary hover:bg-surface-alt"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-h3 absolute left-1/2 -translate-x-1/2 text-ink">{title}</h1>
        <div className="min-w-11">{right}</div>
      </div>
      {children && (
        <div className="mx-auto w-full max-w-2xl px-4 pb-3 sm:px-6">{children}</div>
      )}
    </div>
  );
}
