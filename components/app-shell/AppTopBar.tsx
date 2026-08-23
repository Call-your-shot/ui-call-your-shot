"use client";

import Button from "@/components/ui/Button";
import { useDemo } from "@/lib/demo-context";
import { emailInitials, useSignedInEmail } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { FrontendNotification, NotificationsApiResponse } from "@/app/api/notifications/route";
import { NEW_ASSESSMENT_HREF } from "@/lib/billFlow";
import { Bell, Menu, Plus, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

interface PageMeta {
  title: string;
  breadcrumb?: string;
}

function getPageMeta(pathname: string): PageMeta {
  if (pathname.startsWith("/dashboard")) return { title: "Dashboard" };
  if (pathname.match(/^\/plans\/[^/]+\/leave/)) return { title: "Leave this property", breadcrumb: "My plans" };
  if (pathname.match(/^\/plans\/[^/]+/)) return { title: "Plan details", breadcrumb: "My plans" };
  if (pathname.startsWith("/plans")) return { title: "My plans" };
  if (pathname.startsWith("/properties/new")) return { title: "Add property", breadcrumb: "My properties" };
  if (pathname.match(/^\/properties\/[^/]+/)) return { title: "Property details", breadcrumb: "My properties" };
  if (pathname.startsWith("/properties")) return { title: "My properties" };
  if (pathname.match(/^\/proposal\/[^/]+\/landlord/)) return { title: "Landlord view", breadcrumb: "My plans" };
  if (pathname.startsWith("/proposal/")) return { title: "Proposal document", breadcrumb: "My plans" };
  if (pathname.startsWith("/savings")) return { title: "Savings history" };
  if (pathname.startsWith("/income")) return { title: "Income history" };
  if (pathname.startsWith("/green-credits")) return { title: "Green credits" };
  if (pathname.startsWith("/report")) return { title: "Report an issue" };
  if (pathname.startsWith("/settings")) return { title: "Settings" };
  return { title: "Dashboard" };
}

export default function AppTopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const { title, breadcrumb } = getPageMeta(pathname);
  const { account } = useDemo();
  const signedInEmail = useSignedInEmail();

  const [scrolled, setScrolled] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<FrontendNotification[]>([]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node))
        setBellOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Demo mode surfaces its two hardcoded conditions below instead — real
  // notifications (leave requests, proposal responses, etc.) only exist for
  // signed-in accounts on the real backend.
  useEffect(() => {
    // Nothing to fetch in demo mode — the render below only reads
    // `notifications` when `signedInEmail` is set, so there's no stale
    // state to clear here.
    if (!signedInEmail) return;
    let cancelled = false;
    fetch(`/api/notifications?email=${encodeURIComponent(signedInEmail)}`)
      .then((res) => res.json())
      .then((data: NotificationsApiResponse) => {
        if (!cancelled) setNotifications(data.notifications ?? []);
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      });
    return () => {
      cancelled = true;
    };
    // Re-fetches on every navigation so acting on a notification elsewhere
    // (e.g. approving a leave request) clears its badge here shortly after.
  }, [signedInEmail, pathname]);

  const pendingTenancy = account.tenancies.find(
    (t) => t.status === "awaiting_landlord" || t.status === "proposal_sent"
  );
  const propertyWithAlert = account.ownedProperties.find((p) => p.performanceAlert);
  const hasUnread = signedInEmail
    ? notifications.some((n) => !n.read)
    : Boolean(pendingTenancy || propertyWithAlert);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 h-16 shrink-0 bg-[rgba(249,250,251,0.8)] backdrop-blur-md transition-shadow duration-200",
        scrolled && "shadow-sm-card"
      )}
    >
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-grey-600 hover:bg-grey-200 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="min-w-0">
            {breadcrumb && (
              <p className="hidden truncate text-[13px] text-grey-500 sm:block">
                {breadcrumb}
              </p>
            )}
            <h2 className="text-h1 truncate">{title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <Button href={NEW_ASSESSMENT_HREF}>
              <Plus size={16} aria-hidden="true" />
              New assessment
            </Button>
          </div>

          <button
            type="button"
            aria-label="Search"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-grey-600 hover:bg-grey-200 sm:flex"
          >
            <Search size={19} />
          </button>

          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => setBellOpen((o) => !o)}
              aria-label="Notifications"
              aria-haspopup="true"
              aria-expanded={bellOpen}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-grey-600 hover:bg-grey-200"
            >
              <Bell size={19} />
              {hasUnread && (
                <span
                  className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-error"
                  aria-hidden="true"
                />
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl bg-surface p-3 shadow-hover">
                <p className="mb-2 text-[12px] font-bold tracking-wider text-grey-500 uppercase">
                  Notifications
                </p>
                {signedInEmail ? (
                  notifications.length === 0 ? (
                    <p className="text-small px-1 py-2">Nothing new right now.</p>
                  ) : (
                    <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "rounded-lg p-3 text-[13px] text-grey-800",
                            n.actionRequired ? "bg-warning-light" : "bg-grey-100"
                          )}
                        >
                          <p>{n.message}</p>
                          <p className="mt-1 text-[11px] text-grey-500">{timeAgo(n.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <>
                    {!pendingTenancy && !propertyWithAlert && (
                      <p className="text-small px-1 py-2">Nothing new right now.</p>
                    )}
                    {pendingTenancy && (
                      <div className="mb-2 rounded-lg bg-warning-light p-3 text-[13px] text-grey-800 last:mb-0">
                        {pendingTenancy.landlordName} hasn&apos;t responded to your proposal yet.
                      </div>
                    )}
                    {propertyWithAlert && (
                      <div className="rounded-lg bg-error-light p-3 text-[13px] text-grey-800">
                        {propertyWithAlert.performanceAlert?.message}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-lighter text-[13px] font-bold text-primary-darker"
            title={signedInEmail ?? undefined}
          >
            {signedInEmail ? emailInitials(signedInEmail) : account.avatarInitials}
          </span>
        </div>
      </div>
    </header>
  );
}
