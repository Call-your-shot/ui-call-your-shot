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

  const planUrl = new URL(`/plans/${data.plan.id}`, request.nextUrl.origin).toString();
  const qrDataUrl = await QRCode.toDataURL(planUrl, { margin: 1, width: 300 });

  const buffer = await renderToBuffer(ProposalDocument({ data, qrDataUrl }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${data.reference}-proposal.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
