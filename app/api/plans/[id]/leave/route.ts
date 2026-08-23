import { backendErrorResponse, backendFetch } from "@/lib/backend/server";
import { getSessionEmail } from "@/lib/backend/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = await getSessionEmail();
  if (!email) return Response.json({ message: "Not signed in" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    return Response.json(await backendFetch(`/api/plans/${encodeURIComponent(id)}/leave`, {
      method: "POST",
      body: JSON.stringify({ ...body, email }),
    }));
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = await getSessionEmail();
  if (!email) return Response.json({ message: "Not signed in" }, { status: 401 });
  try {
    const { id } = await params;
    return Response.json(await backendFetch(`/api/plans/${encodeURIComponent(id)}/leave?email=${encodeURIComponent(email)}`, { method: "DELETE" }));
  } catch (error) {
    return backendErrorResponse(error);
  }
}
