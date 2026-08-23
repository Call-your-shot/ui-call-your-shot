import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { registerFonts } from "@/lib/pdf/fonts";
import { loadProposalPdfData } from "@/lib/pdf/data";
import { ProposalDocument } from "@/lib/pdf/ProposalDocument";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = loadProposalPdfData(id);

  if (!data) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  registerFonts();

  // A real, backend-created proposal's landlord invite link takes priority
  // over the plan-tracking URL — before the landlord has accepted, "the
  // live plan" doesn't exist yet, only the invite does. Restricted to our
  // own origin so this endpoint can't be used to QR-code an arbitrary URL.
  const requestedInviteUrl = request.nextUrl.searchParams.get("inviteUrl");
  let inviteUrl: string | null = null;
  if (requestedInviteUrl) {
    try {
      inviteUrl = new URL(requestedInviteUrl, request.nextUrl.origin).origin === request.nextUrl.origin
        ? requestedInviteUrl
        : null;
    } catch {
      inviteUrl = null;
    }
  }
  const qrTargetUrl = inviteUrl || new URL(`/plans/${data.plan.id}`, request.nextUrl.origin).toString();
  const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, { margin: 1, width: 300 });
  const qrCaption = inviteUrl ? "Scan to review and accept this proposal" : undefined;

  const buffer = await renderToBuffer(ProposalDocument({ data, qrDataUrl, qrCaption }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${data.reference}-proposal.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
