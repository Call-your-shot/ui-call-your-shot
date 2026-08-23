// ---------------------------------------------------------------------------
// Types for the "read the uploaded bill" feature (Gemini vision extraction).
// ---------------------------------------------------------------------------

export interface ExtractedBillData {
  address: string;
  billingPeriodStart: string; // ISO date, best-effort
  billingPeriodEnd: string; // ISO date, best-effort
  usageKwh: number;
  /** Total amount charged for the period, in dollars — 0 if not legible/shown. */
  totalCostDollars: number;
  retailer: string;
  confidence: "high" | "medium" | "low";
}

export type BillErrorCode = "NOT_CONFIGURED" | "NOT_A_BILL" | "API_ERROR";

export interface BillApiError {
  ok: false;
  code: BillErrorCode;
  message: string;
}

export interface BillApiSuccess {
  ok: true;
  result: ExtractedBillData;
}

export type BillApiResponse = BillApiSuccess | BillApiError;
