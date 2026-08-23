import type { BillFlowState } from "@/lib/billFlow";
import type { AnnualLoadRequestPayload } from "./types";

/** Builds the "full form" payload from whatever's already been saved to the
 * bill flow — used once scan + household are both done (e.g. on /roof),
 * where the flow on disk is up to date. Mid-household-page, build the
 * payload from live component state instead (the flow hasn't been saved
 * with the current step's answers yet). */
export function billFlowToPayload(flow: BillFlowState): AnnualLoadRequestPayload {
  return {
    address: flow.address,
    billUsageKwh: flow.usageKwh ?? 0,
    billingPeriodStart: flow.billingPeriodStart,
    billingPeriodEnd: flow.billingPeriodEnd,
    billTotalCostDollars: flow.billTotalCostDollars,
    homeDuringDay: flow.homeDuringDay,
    occupantCount: flow.occupantCount,
    heatingNotUsedThisMonth: flow.heatingNotUsedThisMonth,
    heatingHours: flow.heatingHours,
    coolingNotUsedThisMonth: flow.coolingNotUsedThisMonth,
    coolingHours: flow.coolingHours,
    poolNotUsedThisMonth: flow.poolNotUsedThisMonth,
    poolHours: flow.poolHours,
    evNotUsedThisMonth: flow.evNotUsedThisMonth,
    evHours: flow.evHours,
    hotWaterNotUsedThisMonth: flow.hotWaterNotUsedThisMonth,
    hotWaterHours: flow.hotWaterHours,
  };
}
