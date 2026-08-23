import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { DemoProvider } from "@/lib/demo-context";
import DemoPanel from "@/components/DemoPanel";

const publicSans = localFont({
  variable: "--font-public-sans",
  src: [
    { path: "../assets/fonts/PublicSans-Regular.woff", weight: "400", style: "normal" },
    { path: "../assets/fonts/PublicSans-Italic.woff", weight: "400", style: "italic" },
    { path: "../assets/fonts/PublicSans-Medium.woff", weight: "500", style: "normal" },
    { path: "../assets/fonts/PublicSans-SemiBold.woff", weight: "600", style: "normal" },
    { path: "../assets/fonts/PublicSans-Bold.woff", weight: "700", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CYS Solar — Rooftop solar for renters",
  description:
    "CYS Solar lets tenants buy solar power from their landlord at half the grid rate, until the system pays for itself.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F9FAFB",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${publicSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-surface-alt text-ink" suppressHydrationWarning>
        <DemoProvider>
          {children}
          <DemoPanel />
        </DemoProvider>
      </body>
    </html>
  );
}
