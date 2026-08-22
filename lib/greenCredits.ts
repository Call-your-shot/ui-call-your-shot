export type GreenProjectCategory =
  | "energy_storage"
  | "rooftop_solar"
  | "habitat_restoration";

export interface GreenCreditWallet {
  availableCredits: number;
  lifetimeEarnedCredits: number;
  lifetimeAllocatedCredits: number;
  verifiedSolarKwh: number;
}

export interface GreenProject {
  id: string;
  category: GreenProjectCategory;
  title: string;
  description: string;
  location: string;
  targetCredits: number;
  directedCredits: number;
  sponsorName: string;
  sponsorCommitmentDollars: number;
  creditsPerSponsorDollar: number;
  impactLabel: string;
  verificationMethod: string;
  imagePath: string;
}

export interface GreenCreditActivity {
  id: string;
  type: "earned" | "allocated";
  title: string;
  detail: string;
  date: string;
  credits: number;
}

export interface GreenCreditDashboardSummary {
  currentBalance: number;
  impactCreditsInvested: number;
}

export interface AllocationResult {
  allocatedCredits: number;
  partial: boolean;
  sponsorFundingUnlockedDollars: number;
  remainingWalletCredits: number;
}

const wallets: Record<string, GreenCreditWallet> = {
  sarah: {
    availableCredits: 2310,
    lifetimeEarnedCredits: 3510,
    lifetimeAllocatedCredits: 1200,
    verifiedSolarKwh: 5014,
  },
  david: {
    availableCredits: 1880,
    lifetimeEarnedCredits: 2580,
    lifetimeAllocatedCredits: 700,
    verifiedSolarKwh: 8600,
  },
  priya: {
    availableCredits: 2840,
    lifetimeEarnedCredits: 4760,
    lifetimeAllocatedCredits: 1920,
    verifiedSolarKwh: 6800,
  },
};

export const greenProjects: GreenProject[] = [
  {
    id: "illawarra-community-battery",
    category: "energy_storage",
    title: "Illawarra community battery",
    description:
      "Support shared battery capacity that helps local households use more renewable electricity after sunset.",
    location: "Illawarra, NSW",
    targetCredits: 250_000,
    directedCredits: 162_450,
    sponsorName: "BrightGrid Community Fund",
    sponsorCommitmentDollars: 2500,
    creditsPerSponsorDollar: 100,
    impactLabel: "500 kWh of shared storage",
    verificationMethod: "Commissioning records and quarterly operator reports",
    imagePath: "/green-projects/illawarra-community-battery.webp",
  },
  {
    id: "social-housing-solar",
    category: "rooftop_solar",
    title: "Solar for social housing",
    description:
      "Help install rooftop solar for households facing energy hardship across regional New South Wales.",
    location: "New South Wales",
    targetCredits: 400_000,
    directedCredits: 289_300,
    sponsorName: "Green Horizon Foundation",
    sponsorCommitmentDollars: 4000,
    creditsPerSponsorDollar: 100,
    impactLabel: "25 kW of new solar capacity",
    verificationMethod: "Installer certificates and annual generation reports",
    imagePath: "/green-projects/social-housing-solar.webp",
  },
  {
    id: "coastal-habitat-restoration",
    category: "habitat_restoration",
    title: "Coastal habitat restoration",
    description:
      "Restore native coastal vegetation and improve habitat resilience along the South Coast.",
    location: "South Coast, NSW",
    targetCredits: 150_000,
    directedCredits: 98_250,
    sponsorName: "Coast & Country Impact Pool",
    sponsorCommitmentDollars: 1500,
    creditsPerSponsorDollar: 100,
    impactLabel: "10,000 m² of habitat restored",
    verificationMethod: "Geotagged planting records and independent completion review",
    imagePath: "/green-projects/coastal-habitat-restoration.webp",
  },
];

const activityByAccount: Record<string, GreenCreditActivity[]> = {
  sarah: [
    {
      id: "sarah-earn-aug",
      type: "earned",
      title: "Credits earned",
      detail: "Verified solar used at Bellambi Lane",
      date: "21 Aug 2026",
      credits: 118,
    },
    {
      id: "sarah-project-1",
      type: "allocated",
      title: "Supported Solar for social housing",
      detail: "$5.00 of sponsor funding unlocked",
      date: "12 Aug 2026",
      credits: -500,
    },
  ],
  david: [
    {
      id: "david-earn-aug",
      type: "earned",
      title: "Credits earned",
      detail: "Owner share from verified tenant solar use",
      date: "21 Aug 2026",
      credits: 74,
    },
    {
      id: "david-project-1",
      type: "allocated",
      title: "Supported Illawarra community battery",
      detail: "$7.00 of sponsor funding unlocked",
      date: "4 Aug 2026",
      credits: -700,
    },
  ],
  priya: [
    {
      id: "priya-earn-aug",
      type: "earned",
      title: "Credits earned",
      detail: "Tenant and owner shares from verified solar use",
      date: "21 Aug 2026",
      credits: 156,
    },
    {
      id: "priya-project-1",
      type: "allocated",
      title: "Supported Coastal habitat restoration",
      detail: "$10.00 of sponsor funding unlocked",
      date: "9 Aug 2026",
      credits: -1000,
    },
    {
      id: "priya-project-2",
      type: "allocated",
      title: "Supported Solar for social housing",
      detail: "$9.20 of sponsor funding unlocked",
      date: "18 Jul 2026",
      credits: -920,
    },
  ],
};

export function getGreenCreditWallet(accountId: string): GreenCreditWallet {
  return wallets[accountId] ?? wallets.priya;
}

export function getGreenCreditActivity(accountId: string): GreenCreditActivity[] {
  return activityByAccount[accountId] ?? activityByAccount.priya;
}

export function getGreenCreditDashboardSummary(
  wallet: GreenCreditWallet
): GreenCreditDashboardSummary {
  return {
    currentBalance: wallet.availableCredits,
    impactCreditsInvested: wallet.lifetimeAllocatedCredits,
  };
}

export function sponsorFundingForCredits(
  credits: number,
  creditsPerSponsorDollar: number
): number {
  if (credits < 0 || creditsPerSponsorDollar <= 0) {
    throw new Error("Credits must be non-negative and the sponsor rate must be positive.");
  }
  return Math.round((credits / creditsPerSponsorDollar) * 100) / 100;
}

export function allocateGreenCredits({
  requestedCredits,
  availableCredits,
  projectRemainingCredits,
  creditsPerSponsorDollar,
}: {
  requestedCredits: number;
  availableCredits: number;
  projectRemainingCredits: number;
  creditsPerSponsorDollar: number;
}): AllocationResult {
  if (!Number.isInteger(requestedCredits) || requestedCredits <= 0) {
    throw new Error("Enter a whole number of credits greater than zero.");
  }
  if (requestedCredits > availableCredits) {
    throw new Error("You do not have enough green credits for this allocation.");
  }
  if (projectRemainingCredits <= 0) {
    throw new Error("This project has already reached its credit target.");
  }

  const allocatedCredits = Math.min(requestedCredits, projectRemainingCredits);
  return {
    allocatedCredits,
    partial: allocatedCredits < requestedCredits,
    sponsorFundingUnlockedDollars: sponsorFundingForCredits(
      allocatedCredits,
      creditsPerSponsorDollar
    ),
    remainingWalletCredits: availableCredits - allocatedCredits,
  };
}
