"use client";

import { useDemo } from "@/lib/demo-context";
import { demoAccounts } from "@/lib/demo-context";
import { cn } from "@/lib/utils";
import { Settings2, X } from "lucide-react";
import Link from "next/link";

const jumpLinks: { label: string; href: string }[] = [
  { label: "Landing", href: "/" },
  { label: "Sign in", href: "/signin" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Household", href: "/household" },
  { label: "Your roof", href: "/roof" },
  { label: "Results", href: "/results" },
  { label: "My plans", href: "/plans" },
  { label: "My properties", href: "/properties" },
  { label: "Savings history", href: "/savings" },
  { label: "Income history", href: "/income" },
  { label: "Green credits", href: "/green-credits" },
  { label: "Report an issue", href: "/report" },
  { label: "Settings", href: "/settings" },
];

const accountBlurbs: Record<string, string> = {
  sarah: "Tenant only",
  david: "Landlord only, 2 properties",
  qimatx: "Both — tenant & landlord",
};

export default function DemoPanel() {
  const {
    account,
    accountId,
    setAccountId,
    scenario,
    setScenario,
    forceRefusal,
    setForceRefusal,
    panelOpen,
    setPanelOpen,
  } = useDemo();

  if (!panelOpen) {
    return (
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        aria-label="Open demo controls"
        className="fixed right-0 bottom-0 z-50 h-10 w-10 opacity-20"
      >
        <span className="sr-only">Demo controls</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-hover">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-grey-900 flex items-center gap-2 text-sm font-semibold">
            <Settings2 size={16} aria-hidden="true" /> Demo controls
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-grey-200 text-grey-600"
            aria-label="Close demo controls"
          >
            <X size={16} />
          </button>
        </div>

        <div>
          <p className="text-grey-500 mb-1.5 text-xs font-semibold uppercase">
            Demo account
          </p>
          <div className="flex flex-col gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setAccountId(acc.id)}
                className={cn(
                  "flex min-h-11 items-center justify-between rounded-lg px-3 py-2 text-left",
                  accountId === acc.id ? "bg-primary text-white" : "bg-grey-200 text-grey-700"
                )}
              >
                <span>
                  <span className="block text-sm font-semibold">{acc.name}</span>
                  <span
                    className={cn(
                      "block text-[12px]",
                      accountId === acc.id ? "text-white/80" : "text-grey-500"
                    )}
                  >
                    {accountBlurbs[acc.id]}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <p className="text-grey-500 mt-1.5 text-[12px]">
            Viewing as <span className="font-semibold">{account.name}</span> —{" "}
            {account.tenancies.length} plan{account.tenancies.length === 1 ? "" : "s"},{" "}
            {account.ownedProperties.length} propert
            {account.ownedProperties.length === 1 ? "y" : "ies"}.
          </p>
        </div>

        <div>
          <p className="text-grey-500 mb-1.5 text-xs font-semibold uppercase">
            Assessment flow scenario
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setScenario("bellambi")}
              className={cn(
                "min-h-9 flex-1 rounded-lg px-3 py-2 text-sm font-semibold",
                scenario === "bellambi" ? "bg-accent text-white" : "bg-grey-200 text-grey-600"
              )}
            >
              Bellambi (works)
            </button>
            <button
              onClick={() => setScenario("shaded")}
              className={cn(
                "min-h-9 flex-1 rounded-lg px-3 py-2 text-sm font-semibold",
                scenario === "shaded" ? "bg-accent text-white" : "bg-grey-200 text-grey-600"
              )}
            >
              Bulli (fails)
            </button>
          </div>
        </div>

        <label className="bg-grey-100 flex items-center justify-between rounded-lg px-3 py-2.5">
          <span className="text-grey-900 text-sm font-medium">
            Force refusal screen on /results
          </span>
          <input
            type="checkbox"
            checked={forceRefusal}
            onChange={(e) => setForceRefusal(e.target.checked)}
            className="accent-primary h-5 w-5"
          />
        </label>

        <div>
          <p className="text-grey-500 mb-1.5 text-xs font-semibold uppercase">
            Jump to screen
          </p>
          <div className="grid grid-cols-2 gap-2">
            {jumpLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setPanelOpen(false)}
                className="bg-grey-200 text-grey-700 active:bg-grey-300 rounded-lg px-3 py-2 text-center text-[13px] font-medium"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
