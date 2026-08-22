// ---------------------------------------------------------------------------
// Demo auth session — just remembers which email the person signed in with.
// No token, no server session: every account-scoped API call sends this
// email straight through, matching the backend's email-based endpoints.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";

const COOKIE_NAME = "sunshare_email";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function getSignedInEmail(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setSignedInEmail(email: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(email)}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

export function clearSignedInEmail(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

/** Reads the signed-in email after mount only, so server-rendered and
 * first-client-paint markup match (the cookie only exists in the browser) —
 * same pattern as DemoContext's own localStorage sync. */
export function useSignedInEmail(): string | null {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the cookie after mount
    setEmail(getSignedInEmail());
  }, []);
  return email;
}

/** Display form for an email in the UI — just the part before "@", no
 * domain. There's no separate display name from the backend, so this is
 * shown in place of one. */
export function emailDisplayName(email: string): string {
  return email.split("@")[0] ?? email;
}

/** Short initials for an avatar badge, derived from the local part of the
 * email (there's no real display name from the backend, just the address). */
export function emailInitials(email: string): string {
  const local = email.split("@")[0] ?? "";
  const letters = local.replace(/[^a-zA-Z]/g, "");
  return (letters.slice(0, 2) || "?").toUpperCase();
}
