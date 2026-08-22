// ---------------------------------------------------------------------------
// Demo auth session — just remembers which email the person signed in with.
// No token, no server session: every account-scoped API call sends this
// email straight through, matching the backend's email-based endpoints.
// ---------------------------------------------------------------------------

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
