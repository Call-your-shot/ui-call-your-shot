import { backendErrorResponse, backendFetch } from "@/lib/backend/server";
import type { BackendProposal } from "@/lib/backend/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return Response.json(await backendFetch<BackendProposal>(`/proposals/${encodeURIComponent(id)}`));
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    return Response.json(await backendFetch<BackendProposal>(`/proposals/${encodeURIComponent(id)}/accept`, {
      method: "POST",
      body: JSON.stringify(body),
    }));
  } catch (error) {
    return backendErrorResponse(error);
  }
}
