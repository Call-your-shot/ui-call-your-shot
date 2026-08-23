import { afterEach, describe, expect, it, vi } from "vitest";
import { NEW_ASSESSMENT_HREF, resetBillFlow } from "./billFlow";

describe("new assessment flow", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("starts at bill scanning before household and roof", () => {
    expect(NEW_ASSESSMENT_HREF).toBe("/scan?new=1");
  });

  it("clears both the prior household draft and completed assessment reference", () => {
    const removeItem = vi.fn();
    vi.stubGlobal("window", { sessionStorage: { removeItem } });

    resetBillFlow();

    expect(removeItem).toHaveBeenCalledWith("sunshare-bill-flow");
    expect(removeItem).toHaveBeenCalledWith("sunshare-latest-assessment-id");
  });
});
