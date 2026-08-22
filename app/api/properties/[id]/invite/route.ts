import { backendErrorResponse, backendFetch } from "@/lib/backend/server";
import { getSessionEmail } from "@/lib/backend/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = await getSessionEmail();
  if (!email) return Response.json({ message: "Not signed in" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    return Response.json(await backendFetch(`/api/properties/${encodeURIComponent(id)}/invite`, {
      method: "POST",
      body: JSON.stringify({ email, inviteEmail: body.inviteEmail }),
    }));
  } catch (error) {
    return backendErrorResponse(error);
  }
}
