"use client";

import Logo from "@/components/civic/Logo";
import { dashboardNavItem, getNavGroups, utilityNavItems, type NavItem } from "./navData";
import { useDemo } from "@/lib/demo-context";
import { emailDisplayName, emailInitials, useSignedInEmail } from "@/lib/session";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <Link
        href={item.href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-11 items-center gap-3 rounded-lg px-3 text-[14px] font-medium",
          active
            ? "bg-primary/8 font-semibold text-primary"
            : item.empty
              ? "text-grey-500"
              : "text-grey-600"
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

export default function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { account } = useDemo();
  const signedInEmail = useSignedInEmail();
  const navGroups = getNavGroups(account);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(22,28,36,0.48)]"
      />
      <div className="animate-slide-in-left relative flex h-full w-[280px] max-w-[85vw] flex-col bg-surface shadow-hover">
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-[18px] font-bold tracking-tight text-grey-900">
              SunShare
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-grey-600 hover:bg-grey-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <ul className="mt-2 flex flex-col gap-0.5">
            <NavLink
              item={dashboardNavItem}
              active={isActive(pathname, dashboardNavItem.href)}
              onClick={onClose}
            />
          </ul>

          {navGroups.map((group) => (
            <div key={group.label} className="mt-6">
              <p className="mb-1.5 px-4 text-[11px] font-bold tracking-wider text-grey-500 uppercase">
                {group.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(pathname, item.href)}
                    onClick={onClose}
                  />
                ))}
              </ul>
            </div>
          ))}

          <div className="mt-6">
            <ul className="flex flex-col gap-0.5">
              {utilityNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(pathname, item.href)}
                  onClick={onClose}
                />
              ))}
            </ul>
          </div>
        </div>

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
      </div>
    </div>
  );
}
