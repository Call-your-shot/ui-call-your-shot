import { describe, expect, it } from "vitest";
import {
  allocateGreenCredits,
  greenProjects,
  getGreenCreditDashboardSummary,
  sponsorFundingForCredits,
} from "@/lib/greenCredits";

describe("green credit allocation", () => {
  it("provides a real project image for every curated project", () => {
    expect(greenProjects).toHaveLength(3);
    expect(greenProjects.every((project) => project.imagePath.endsWith(".webp"))).toBe(true);
  });

  it("keeps the dashboard focused on balance and invested impact credits", () => {
    expect(
      getGreenCreditDashboardSummary({
        availableCredits: 2310,
        lifetimeEarnedCredits: 3510,
        lifetimeAllocatedCredits: 1200,
        verifiedSolarKwh: 5014,
      })
    ).toEqual({
      currentBalance: 2310,
      impactCreditsInvested: 1200,
    });
  });

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
