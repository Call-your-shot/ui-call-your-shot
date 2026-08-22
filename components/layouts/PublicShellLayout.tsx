import SiteFooter from "@/components/civic/SiteFooter";
import SiteHeader from "@/components/civic/SiteHeader";

export default function PublicShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
