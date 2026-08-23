import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";
import { DemoProvider } from "@/lib/demo-context";
import DemoPanel from "@/components/DemoPanel";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
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
    <html lang="en" className={`${publicSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-surface-alt text-ink">
        <DemoProvider>
          {children}
          <DemoPanel />
        </DemoProvider>
      </body>
    </html>
  );
}
