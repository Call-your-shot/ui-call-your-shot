"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ScenarioId } from "@/lib/mockData";
import { defaultAccountId, mockAccounts, type Account } from "@/lib/accounts";

interface DemoState {
  /** False until the account has been synced from localStorage. Pages that
   * look up a specific tenancy/property by id should wait for this before
   * treating a miss as a real 404 — otherwise a direct link into a
   * non-default demo account's data will flash a false not-found against
   * the default account before hydration completes. */
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
  /** Forces a re-render after code has mutated fields on the current
   * account's mock data in place (e.g. submitting the leave flow). There's
   * no backend here — this is the deliberate, minimal way demo actions
   * become visible without building a full mock data store. */
  refresh: () => void;
}

const DemoContext = createContext<DemoState | null>(null);

const STORAGE_KEY = "sunshare-demo-state";

interface PersistedSettings {
  accountId: string;
  scenario: ScenarioId;
  forceRefusal: boolean;
}

const defaultSettings: PersistedSettings = {
  accountId: defaultAccountId,
  scenario: "bellambi",
  forceRefusal: false,
};

export function DemoProvider({ children }: { children: ReactNode }) {
  // Render defaults on both server and first client pass to avoid a
  // hydration mismatch, then sync from localStorage/query string once
  // mounted — matches the pattern used for theme toggles etc.
  const [settings, setSettings] = useState<PersistedSettings>(defaultSettings);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      // Deliberate one-time sync from localStorage after mount, so the
      // first client render matches SSR (avoids a hydration mismatch).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettings({
        accountId:
          typeof parsed.accountId === "string" && mockAccounts[parsed.accountId]
            ? parsed.accountId
            : defaultSettings.accountId,
        scenario: parsed.scenario ?? defaultSettings.scenario,
        forceRefusal:
          typeof parsed.forceRefusal === "boolean"
            ? parsed.forceRefusal
            : defaultSettings.forceRefusal,
      });
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "1") setPanelOpen(true);
    } catch {
      // ignore malformed storage
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore write failures (private mode etc.)
    }
  }, [hydrated, settings]);

  const value = useMemo<DemoState>(
    () => ({
      hydrated,
      account: mockAccounts[settings.accountId] ?? mockAccounts[defaultAccountId],
      accountId: settings.accountId,
      setAccountId: (accountId) => setSettings((s) => ({ ...s, accountId })),
      scenario: settings.scenario,
      setScenario: (scenario) => setSettings((s) => ({ ...s, scenario })),
      forceRefusal: settings.forceRefusal,
      setForceRefusal: (forceRefusal) =>
        setSettings((s) => ({ ...s, forceRefusal })),
      panelOpen,
      setPanelOpen,
      refresh: () => setSettings((s) => ({ ...s })),
    }),
    [settings, panelOpen, hydrated]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}
