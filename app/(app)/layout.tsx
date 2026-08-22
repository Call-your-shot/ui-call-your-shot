"use client";

import { useState } from "react";
import Sidebar from "@/components/app-shell/Sidebar";
import AppTopBar from "@/components/app-shell/AppTopBar";
import MobileDrawer from "@/components/app-shell/MobileDrawer";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-surface-alt">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar onOpenMenu={() => setDrawerOpen(true)} />

        <main className="flex-1 pb-16">
          <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 pb-16 sm:px-10">
            {children}
          </div>
        </main>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
