import { backendErrorResponse, backendFetch } from "@/lib/backend/server";
import { getSessionEmail } from "@/lib/backend/session";
import type { BackendProposal, InitialAssessment, UserProfile } from "@/lib/backend/types";

export async function POST(request: Request) {
  const email = await getSessionEmail();
  if (!email) return Response.json({ message: "Not signed in" }, { status: 401 });
  try {
    const body = (await request.json()) as { assessmentId?: string; landlordEmail?: string };
    if (!body.assessmentId) return Response.json({ message: "Assessment is required" }, { status: 400 });
    const [profile, assessment] = await Promise.all([
      backendFetch<UserProfile>(`/api/v1/users/profile?email=${encodeURIComponent(email)}`),
      backendFetch<InitialAssessment>(`/api/v1/assessments/${encodeURIComponent(body.assessmentId)}`),
    ]);
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
    const annualUsage = Number(assessment.monteCarlo.assumptions.expected_annual_usage_kwh);
    const proposal = await backendFetch<BackendProposal>("/create-proposal", {
      method: "POST",
      body: JSON.stringify({
        assessmentId: body.assessmentId,
        address: assessment.address.formattedAddress,
        tenant: { name: profile.full_name, email: profile.email },
        landlord: body.landlordEmail
          ? { name: "Property owner", email: body.landlordEmail }
          : undefined,
        system: {
          panelCount: assessment.system.panelCount,
          systemSizeKw: assessment.system.systemSizeKw,
          panelWatts: assessment.system.panelWatts,
          orientation: "Modelled roof configuration",
          pitchDegrees: 0,
          estimatedAnnualAcKwh: assessment.system.expectedAnnualGenerationKwh,
          source: assessment.system.source === "google" ? "google" : "mock",
        },
        consumption: {
          billUsageKwh: annualUsage / 12,
          billingPeriodStart: start.toISOString().slice(0, 10),
          billingPeriodEnd: end.toISOString().slice(0, 10),
          estimatedAnnualKwh: annualUsage,
          ratePerKwhCents: assessment.pricing.gridRateCentsPerKwh,
          rateSource: "bill",
          recommendedSystemSizeKw: assessment.system.systemSizeKw,
          systemSizeSource: "backend",
        },
      }),
    });
    return Response.json(proposal, { status: 201 });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
