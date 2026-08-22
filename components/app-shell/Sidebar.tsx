"use client";

import Logo from "@/components/civic/Logo";
import { dashboardNavItem, getNavGroups, utilityNavItems, type NavItem } from "./navData";
import { useDemo } from "@/lib/demo-context";
import { emailDisplayName, emailInitials, useSignedInEmail } from "@/lib/session";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-11 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors duration-150",
          active
            ? "bg-primary/8 font-semibold text-primary"
            : item.empty
              ? "text-grey-500 hover:bg-grey-200"
              : "text-grey-600 hover:bg-grey-200"
        )}
      >
        <item.icon size={22} className="shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge ? (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-md bg-primary-lighter px-1.5 text-[11px] font-bold text-primary-darker">
            {item.badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

export default function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { account } = useDemo();
  const signedInEmail = useSignedInEmail();
  const navGroups = getNavGroups(account);

  return (
    <nav
      aria-label="Main"
      className={cn(
        "sticky top-0 hidden h-dvh w-[280px] shrink-0 flex-col border-r border-dashed border-line bg-surface lg:flex",
        className
      )}
    >
      {/* Brand block */}
      <Link href="/dashboard" className="flex h-16 shrink-0 items-center gap-2.5 px-6">
        <Logo size={28} />
        <span className="text-[18px] font-bold tracking-tight text-grey-900">
          SunShare
        </span>
      </Link>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <ul className="mt-2 flex flex-col gap-0.5">
          <NavLink item={dashboardNavItem} active={isActive(pathname, dashboardNavItem.href)} />
        </ul>

        {navGroups.map((group) => (
          <div key={group.label} className="mt-6">
            <p className="mb-1.5 px-4 text-[11px] font-bold tracking-wider text-grey-500 uppercase">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
              ))}
            </ul>
          </div>
        ))}

        <div className="mt-6">
          <ul className="flex flex-col gap-0.5">
            {utilityNavItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </ul>
        </div>
      </div>

      {/* Footer — account identity only; role/account switching is demo
          tooling (DemoPanel), never a control a real user would see. */}
      <div className="p-3">
        <div className="flex items-center gap-2.5 rounded-2xl bg-grey-200 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-[13px] font-bold text-primary-darker">
            {signedInEmail ? emailInitials(signedInEmail) : account.avatarInitials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-grey-900">
              {signedInEmail ? emailDisplayName(signedInEmail) : account.name}
            </p>
            {!signedInEmail && <p className="truncate text-[12px] text-grey-500">{account.email}</p>}
          </div>
        </div>
      </div>
    </nav>
  );
}
