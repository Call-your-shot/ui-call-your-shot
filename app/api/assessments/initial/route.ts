import { backendErrorResponse, backendFetch } from "@/lib/backend/server";
import type { InitialAssessment, InitialAssessmentInput } from "@/lib/backend/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InitialAssessmentInput;
    const assessment = await backendFetch<InitialAssessment>(
      "/api/v1/assessments/initial",
      { method: "POST", body: JSON.stringify(body) },
      30_000
    );
    return Response.json(assessment, { status: 201 });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
