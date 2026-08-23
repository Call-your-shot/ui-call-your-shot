import "server-only";

const DEFAULT_TIMEOUT_MS = 12_000;

export class BackendError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown
  ) {
    super(message);
  }
}

export async function backendFetch<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const baseUrl = process.env.BACKEND_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new BackendError("FastAPI backend is not configured", 503);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new BackendError(
      (payload as { detail?: string } | null)?.detail ?? `Backend responded ${response.status}`,
      response.status,
      payload
    );
  }
  return payload as T;
}

export function backendErrorResponse(error: unknown): Response {
  if (error instanceof BackendError) {
    return Response.json(
      { ok: false, message: error.message },
      { status: error.status }
    );
  }
  const message = error instanceof Error ? error.message : "Backend request failed";
  return Response.json({ ok: false, message }, { status: 502 });
}
