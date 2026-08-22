import { randomUUID } from "node:crypto";
import { backendErrorResponse, backendFetch } from "@/lib/backend/server";
import { getSessionEmail } from "@/lib/backend/session";

export async function GET() {
  const email = await getSessionEmail();
  if (!email) return Response.json({ message: "Not signed in" }, { status: 401 });
  try {
    const query = `email=${encodeURIComponent(email)}`;
    const [wallet, ledger, projects, allocations] = await Promise.all([
      backendFetch(`/api/v1/green-credits/wallet?${query}`),
      backendFetch(`/api/v1/green-credits/ledger?${query}`),
      backendFetch(`/api/v1/green-projects?${query}`),
      backendFetch(`/api/v1/green-credits/allocations?${query}`),
    ]);
    return Response.json({ wallet, ledger, projects, allocations });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const email = await getSessionEmail();
  if (!email) return Response.json({ message: "Not signed in" }, { status: 401 });
  try {
    const body = (await request.json()) as {
      projectId?: string;
      requestedCredits?: number;
      idempotencyKey?: string;
    };
    if (!body.projectId || !body.requestedCredits || body.requestedCredits <= 0) {
      return Response.json({ message: "Project and positive credit amount are required" }, { status: 400 });
    }
    const result = await backendFetch(
      `/api/v1/green-projects/${encodeURIComponent(body.projectId)}/allocations?email=${encodeURIComponent(email)}`,
      {
        method: "POST",
        body: JSON.stringify({
          requested_credits: body.requestedCredits.toFixed(6),
          idempotency_key: body.idempotencyKey ?? `green-ui-${randomUUID()}`,
        }),
      }
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
