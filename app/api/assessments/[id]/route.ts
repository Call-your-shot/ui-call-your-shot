import { backendErrorResponse, backendFetch } from "@/lib/backend/server";
import type { InitialAssessment } from "@/lib/backend/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return Response.json(
      await backendFetch<InitialAssessment>(`/api/v1/assessments/${encodeURIComponent(id)}`)
    );
  } catch (error) {
    return backendErrorResponse(error);
  }
}
