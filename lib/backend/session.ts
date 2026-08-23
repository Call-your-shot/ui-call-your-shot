import "server-only";

import { cookies } from "next/headers";

export const SESSION_COOKIE = "sunshare_email";
export const DEFAULT_DEMO_EMAIL = "priya.nair@example.com";

export async function getSessionEmail(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
