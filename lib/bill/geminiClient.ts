import { GoogleGenAI, Type } from "@google/genai";
import type { ExtractedBillData } from "./types";

const MODEL = "gemini-3.5-flash-lite";

const PROMPT = `You are reading a photo or PDF of a household electricity bill.
Extract the property's address, the billing period, the total electricity
usage in kWh for that period, the total dollar amount charged, and the
retailer name.

Rules:
- Dates must be ISO format (YYYY-MM-DD). If a date is genuinely illegible,
  make your best estimate from context rather than leaving it blank.
- usageKwh is the TOTAL kWh consumed across the whole billing period printed
  on the bill (not a daily average) — add peak/shoulder/off-peak usage
  together if they're broken out separately.
- totalCostDollars is the total amount charged/due for this bill (e.g. "Total
  amount due", "Amount payable") — the whole bill, not just the usage line
  item. Use 0 if it genuinely isn't shown anywhere.
- Set found to false only if the image is clearly not an electricity bill at
  all (e.g. a random photo). A blurry or partially legible bill is still
  found=true — just lower confidence and do your best.
- Never invent an address, usage figure, or dollar amount for a non-bill
  image, and never invent a dollar amount that isn't actually printed.`;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    found: {
      type: Type.BOOLEAN,
      description: "true if this is a legible (even if imperfect) electricity bill",
    },
    address: {
      type: Type.STRING,
      description: "Full postal address the bill is addressed to, as printed",
    },
    billingPeriodStart: { type: Type.STRING, description: "YYYY-MM-DD" },
    billingPeriodEnd: { type: Type.STRING, description: "YYYY-MM-DD" },
    usageKwh: { type: Type.NUMBER, description: "Total kWh used across the billing period" },
    totalCostDollars: {
      type: Type.NUMBER,
      description: "Total amount charged for the bill in dollars, 0 if not shown",
    },
    retailer: { type: Type.STRING, description: "Electricity retailer / provider name" },
    confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
  },
  required: [
    "found",
    "address",
    "billingPeriodStart",
    "billingPeriodEnd",
    "usageKwh",
    "totalCostDollars",
    "retailer",
    "confidence",
  ],
};

interface RawBillExtraction {
  found: boolean;
  address: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  usageKwh: number;
  totalCostDollars: number;
  retailer: string;
  confidence: "high" | "medium" | "low";
}

export class NotABillError extends Error {}

/** Server-only — throws on any failure; the API route decides how to
 * present that (never call this from client code, the key must stay server-side). */
export async function extractBillDetails(
  base64Data: string,
  mimeType: string,
  apiKey: string
): Promise<ExtractedBillData> {
  const client = new GoogleGenAI({ apiKey });

  const response = await client.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [{ inlineData: { data: base64Data, mimeType } }, { text: PROMPT }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  const parsed = JSON.parse(text) as RawBillExtraction;
  if (!parsed.found) {
    throw new NotABillError("That doesn't look like an electricity bill");
  }

  return {
    address: parsed.address,
    billingPeriodStart: parsed.billingPeriodStart,
    billingPeriodEnd: parsed.billingPeriodEnd,
    usageKwh: parsed.usageKwh,
    totalCostDollars: parsed.totalCostDollars,
    retailer: parsed.retailer,
    confidence: parsed.confidence,
  };
}
