import { backendErrorResponse, backendFetch } from "@/lib/backend/server";
import { getSessionEmail } from "@/lib/backend/session";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = await getSessionEmail();
  if (!email) return Response.json({ message: "Not signed in" }, { status: 401 });
  try {
    const { id } = await params;
    return Response.json(await backendFetch(`/api/properties/${encodeURIComponent(id)}/leave-request/acknowledge`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }));
  } catch (error) {
    return backendErrorResponse(error);
  }
}
