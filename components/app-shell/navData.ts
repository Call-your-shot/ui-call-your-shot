import {
  Building2,
  Flag,
  LayoutDashboard,
  LucideIcon,
  Settings,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Account } from "@/lib/accounts";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Present (and shown) only when the count is greater than zero. */
  badge?: number;
  /** True when this item's underlying capability count is zero — rendered
   * in a muted tone, but never hidden (spec: sections are never hidden). */
  empty?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export function getNavGroups(account: Account): NavGroup[] {
  const planCount = account.tenancies.length;
  const propertyCount = account.ownedProperties.length;

  return [
    {
      label: "Properties",
      items: [
        {
          label: "My plans",
          href: "/plans",
          icon: Wallet,
          badge: planCount || undefined,
          empty: planCount === 0,
        },
        {
          label: "My properties",
          href: "/properties",
          icon: Building2,
          badge: propertyCount || undefined,
          empty: propertyCount === 0,
        },
      ],
    },
    {
      label: "History",
      items: [
        { label: "Savings history", href: "/savings", icon: TrendingUp, empty: planCount === 0 },
        { label: "Income history", href: "/income", icon: TrendingUp, empty: propertyCount === 0 },
      ],
    },
  ];
}

export const dashboardNavItem: NavItem = {
  label: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboard,
};

export const utilityNavItems: NavItem[] = [
  { label: "Report an issue", href: "/report", icon: Flag },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function getAllNavItems(account: Account): NavItem[] {
  return [
    dashboardNavItem,
    ...getNavGroups(account).flatMap((g) => g.items),
    ...utilityNavItems,
  ];
}
