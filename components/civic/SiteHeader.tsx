"use client";

import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import UtilityBar from "./UtilityBar";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plans", label: "My plans" },
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <UtilityBar />
      <header
        className={cn(
          "sticky top-0 z-30 border-b border-line bg-surface transition-shadow duration-200",
          scrolled && "shadow-md"
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[19px] font-bold tracking-tight text-primary">
              SunShare
            </span>
          </Link>

          <nav className="hidden items-center gap-6 sm:flex" aria-label="Primary">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[15px] font-medium text-ink hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <Button href="/signin" variant="primary">
              Sign in
            </Button>
          </nav>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded text-primary sm:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-primary-dark px-6 py-6 sm:hidden">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              onClick={() => setMenuOpen(false)}
            >
              <span className="text-[19px] font-bold tracking-tight text-white">
                SunShare
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded text-white"
              aria-label="Close menu"
            >
              <X size={26} />
            </button>
          </div>

          <nav className="mt-10 flex flex-col gap-1" aria-label="Primary">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-4 text-[20px] font-semibold text-white hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto">
            <Button
              href="/signin"
              variant="inverse"
              fullWidth
              onClick={() => setMenuOpen(false)}
            >
              Sign in
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
