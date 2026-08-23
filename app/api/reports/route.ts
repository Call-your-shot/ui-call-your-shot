import { backendErrorResponse, backendFetch } from "@/lib/backend/server";
import { getSessionEmail } from "@/lib/backend/session";

export async function GET() {
  const email = await getSessionEmail();
  if (!email) return Response.json({ message: "Not signed in" }, { status: 401 });
  try {
    return Response.json(await backendFetch(`/api/v1/support-reports?email=${encodeURIComponent(email)}`));
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const email = await getSessionEmail();
  if (!email) return Response.json({ message: "Not signed in" }, { status: 401 });
  try {
    const body = await request.json();
    return Response.json(await backendFetch("/api/v1/support-reports", {
      method: "POST",
      body: JSON.stringify({ ...body, email }),
    }), { status: 201 });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
