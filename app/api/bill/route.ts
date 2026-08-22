import { NextRequest, NextResponse } from "next/server";
import { extractBillDetails, NotABillError } from "@/lib/bill/geminiClient";
import type { BillApiResponse } from "@/lib/bill/types";

const MAX_BASE64_LENGTH = 20_000_000; // ~15MB decoded, matches Gemini's inline data limit

interface BillRequestBody {
  imageBase64?: string;
  mimeType?: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json<BillApiResponse>(
      {
        ok: false,
        code: "NOT_CONFIGURED",
        message: "Bill scanning isn't set up yet — enter your details manually below.",
      },
      { status: 200 }
    );
  }

  let body: BillRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<BillApiResponse>(
      { ok: false, code: "API_ERROR", message: "Malformed request body" },
      { status: 400 }
    );
  }

  if (!body.imageBase64 || !body.mimeType) {
    return NextResponse.json<BillApiResponse>(
      { ok: false, code: "API_ERROR", message: "Missing image data" },
      { status: 400 }
    );
  }

  if (body.imageBase64.length > MAX_BASE64_LENGTH) {
    return NextResponse.json<BillApiResponse>(
      { ok: false, code: "API_ERROR", message: "That file is too large — try a smaller photo or PDF." },
      { status: 400 }
    );
  }

  try {
    const result = await extractBillDetails(body.imageBase64, body.mimeType, apiKey);
    return NextResponse.json<BillApiResponse>({ ok: true, result });
  } catch (err) {
    if (err instanceof NotABillError) {
      return NextResponse.json<BillApiResponse>({
        ok: false,
        code: "NOT_A_BILL",
        message: "We couldn't recognise that as an electricity bill. Try another photo, or enter details manually.",
      });
    }
    console.error("[api/bill] extraction failed:", err);
    return NextResponse.json<BillApiResponse>({
      ok: false,
      code: "API_ERROR",
      message: "Something went wrong reading that file — try again or enter details manually.",
    });
  }
}
