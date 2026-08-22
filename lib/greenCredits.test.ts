import { describe, expect, it } from "vitest";
import { allocateGreenCredits, sponsorFundingForCredits } from "@/lib/greenCredits";

describe("green credit allocation", () => {
  it("converts credits into sponsor funding using the declared rate", () => {
    expect(sponsorFundingForCredits(250, 100)).toBe(2.5);
  });

  it("deducts a valid allocation from the wallet", () => {
    expect(
      allocateGreenCredits({
        requestedCredits: 500,
        availableCredits: 1200,
        projectRemainingCredits: 10_000,
        creditsPerSponsorDollar: 100,
      })
    ).toEqual({
      allocatedCredits: 500,
      partial: false,
      sponsorFundingUnlockedDollars: 5,
      remainingWalletCredits: 700,
    });
  });

  it("caps the allocation at the project's remaining credit target", () => {
    const result = allocateGreenCredits({
      requestedCredits: 500,
      availableCredits: 1000,
      projectRemainingCredits: 125,
      creditsPerSponsorDollar: 100,
    });

    expect(result.allocatedCredits).toBe(125);
    expect(result.partial).toBe(true);
    expect(result.remainingWalletCredits).toBe(875);
  });

  it("rejects allocations larger than the wallet balance", () => {
    expect(() =>
      allocateGreenCredits({
        requestedCredits: 501,
        availableCredits: 500,
        projectRemainingCredits: 1000,
        creditsPerSponsorDollar: 100,
      })
    ).toThrow("not have enough");
  });
});
