import type { SystemSizeApiResponse, SystemSizeRequestPayload } from "./types";

/**
 * Client-side wrapper around POST /api/system-size. Mirrors the server's own
 * catch-and-fall-back behaviour for the one failure it can't catch itself:
 * the fetch never reaching it at all.
 */
export async function fetchSystemSize(payload: SystemSizeRequestPayload): Promise<SystemSizeApiResponse> {
  try {
    const res = await fetch("/api/system-size", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as SystemSizeApiResponse;
  } catch (err) {
    return {
      ok: false,
      code: "API_ERROR",
      message: err instanceof Error ? err.message : "Network error",
      fallback: { systemSizeKw: 1.5, source: "fallback" },
    };
  }
}
