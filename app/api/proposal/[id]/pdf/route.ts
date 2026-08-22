import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { backendErrorResponse, backendFetch } from "@/lib/backend/server";
import type { BackendProposal, InitialAssessment } from "@/lib/backend/types";
import { registerFonts } from "@/lib/pdf/fonts";
import { buildProposalPdfData } from "@/lib/pdf/live-data";
import { LiveProposalDocument } from "@/lib/pdf/LiveProposalDocument";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposal = await backendFetch<BackendProposal>(`/proposals/${encodeURIComponent(id)}`);
    let assessment: InitialAssessment | null = null;
    if (proposal.assessmentId) {
      assessment = await backendFetch<InitialAssessment>(
        `/api/v1/assessments/${encodeURIComponent(proposal.assessmentId)}`
      ).catch(() => null);
    }

    const data = buildProposalPdfData(proposal, assessment);
    registerFonts();
    const proposalUrl = new URL(
      `/proposal/${encodeURIComponent(proposal.inviteToken)}/landlord`,
      request.nextUrl.origin
    ).toString();
    const qrDataUrl = await QRCode.toDataURL(proposalUrl, { margin: 1, width: 300 });
    const buffer = await renderToBuffer(LiveProposalDocument({ data, qrDataUrl }));

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${data.reference}-proposal.pdf"`,
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
