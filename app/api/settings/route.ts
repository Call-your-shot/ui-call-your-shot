import { backendErrorResponse, backendFetch } from "@/lib/backend/server";
import { getSessionEmail } from "@/lib/backend/session";

export async function GET() {
  const email = await getSessionEmail();
  if (!email) return Response.json({ message: "Not signed in" }, { status: 401 });
  try {
    return Response.json(await backendFetch(`/api/v1/users/preferences?email=${encodeURIComponent(email)}`));
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  const email = await getSessionEmail();
  if (!email) return Response.json({ message: "Not signed in" }, { status: 401 });
  try {
    const body = await request.json();
    return Response.json(await backendFetch("/api/v1/users/preferences", {
      method: "PUT",
      body: JSON.stringify({ ...body, email }),
    }));
  } catch (error) {
    return backendErrorResponse(error);
  }
}
