"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ScenarioId } from "@/lib/mockData";
import type { Account } from "@/lib/accounts";

export const demoAccounts = [
  { id: "sarah", name: "Sarah Chen", email: "sarah.chen@example.com" },
  { id: "david", name: "David Marino", email: "david.marino@example.com" },
  { id: "priya", name: "Priya Nair", email: "priya.nair@example.com" },
] as const;

const emptyAccount: Account = {
  id: "",
  name: "",
  email: "",
  avatarInitials: "",
  tenancies: [],
  ownedProperties: [],
};

interface DemoState {
  hydrated: boolean;
  account: Account;
  accountId: string;
  setAccountId: (id: string) => void;
  scenario: ScenarioId;
  setScenario: (s: ScenarioId) => void;
  forceRefusal: boolean;
  setForceRefusal: (v: boolean) => void;
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;
  refresh: () => Promise<void>;
}

const DemoContext = createContext<DemoState | null>(null);
const STORAGE_KEY = "sunshare-demo-visual-state";

function accountIdForEmail(email: string): string {
  return demoAccounts.find((candidate) => candidate.email === email)?.id ?? "account";
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/signin" ||
    pathname.startsWith("/invite/") ||
    (pathname.startsWith("/proposal/") && pathname.endsWith("/landlord"))
  );
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const needsAccount = !isPublicPath(pathname);
  const [account, setAccount] = useState<Account>(emptyAccount);
  const [hydrated, setHydrated] = useState(!needsAccount);
  const [loadError, setLoadError] = useState("");
  const [scenario, setScenario] = useState<ScenarioId>("bellambi");
  const [forceRefusal, setForceRefusal] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from browser-owned demo preferences */
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      if (saved.scenario === "bellambi" || saved.scenario === "shaded") {
        setScenario(saved.scenario);
      }
      if (typeof saved.forceRefusal === "boolean") setForceRefusal(saved.forceRefusal);
      if (new URLSearchParams(window.location.search).get("demo") === "1") {
        setPanelOpen(true);
      }
    } catch {
      // Visual-only demo preferences are non-critical.
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ scenario, forceRefusal }));
    } catch {
      // Ignore private-mode storage failures.
    }
  }, [scenario, forceRefusal]);

  const loadAccount = useCallback(async () => {
    if (!needsAccount) {
      setHydrated(true);
      return;
    }
    setLoadError("");
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Could not load your account");
      setAccount(payload as Account);
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : "Could not load your account");
    } finally {
      setHydrated(true);
    }
  }, [needsAccount]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronises React with the external FastAPI account
    void loadAccount();
  }, [loadAccount]);

  const setAccountId = useCallback(
    (id: string) => {
      const selected = demoAccounts.find((candidate) => candidate.id === id);
      if (!selected) return;
      void (async () => {
        const response = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: selected.email }),
        });
        if (!response.ok) return;
        setHydrated(false);
        await loadAccount();
        router.refresh();
      })();
    },
    [loadAccount, router]
  );

  const value = useMemo<DemoState>(
    () => ({
      hydrated,
      account,
      accountId: accountIdForEmail(account.email),
      setAccountId,
      scenario,
      setScenario,
      forceRefusal,
      setForceRefusal,
      panelOpen,
      setPanelOpen,
      refresh: loadAccount,
    }),
    [account, forceRefusal, hydrated, loadAccount, panelOpen, scenario, setAccountId]
  );

  if (needsAccount && !hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-alt text-body text-muted">
        Loading your SunShare account…
      </div>
    );
  }

  if (needsAccount && loadError) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-h2 text-ink">We couldn&apos;t load your account</h1>
        <p className="text-body text-muted">{loadError}</p>
        <div className="flex gap-3">
          <button className="rounded-lg bg-primary px-4 py-2 font-semibold text-white" onClick={() => void loadAccount()}>
            Try again
          </button>
          <button className="rounded-lg border border-line px-4 py-2 font-semibold text-primary" onClick={() => router.push("/signin")}>
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoState {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used within DemoProvider");
  return context;
}
