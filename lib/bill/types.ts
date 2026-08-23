export interface ExtractedBillData {
  address: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  usageKwh: number;
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
