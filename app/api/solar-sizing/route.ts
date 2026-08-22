import { backendErrorResponse, backendFetch } from "@/lib/backend/server";
import type { SolarSizingInput, SolarSizingResult } from "@/lib/sizing/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SolarSizingInput;
    const sizing = await backendFetch<SolarSizingResult>(
      "/api/v1/solar-sizing/recommend",
      { method: "POST", body: JSON.stringify(body) },
      60_000,
    );
    return Response.json(sizing);
  } catch (error) {
    return backendErrorResponse(error);
  }
}
