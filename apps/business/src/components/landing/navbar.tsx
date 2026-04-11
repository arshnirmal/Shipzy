"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#pricing", label: "Pricing" },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        isScrolled ? "pt-3" : "pt-5",
      )}
    >
      <div className="container-shell">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-3 transition-all md:px-6",
            isScrolled
              ? "glass-panel ring-1 ring-outline-variant/40"
              : "bg-transparent ring-1 ring-transparent",
          )}
        >
          <Link href="/" className="flex items-center gap-3">
            <div className="gradient-brand flex size-9 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground">
              S
            </div>
            <div>
              <p className="title-sm leading-tight">Shipzy Business</p>
              <p className="text-xs text-muted-foreground">
                Digital Curator Edition
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="body-sm link-clean"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "gradient-brand text-primary-foreground shadow-[var(--shadow-ambient-sm)]",
              )}
            >
              Get Started
            </Link>
          </div>

          <button
            className="inline-flex size-9 items-center justify-center rounded-xl text-foreground transition hover:bg-surface-container-low md:hidden"
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent
          side="right"
          className="w-[85%] border-none bg-surface-container-lowest p-0 sm:max-w-xs"
        >
          <div className="flex items-center justify-between p-5">
            <p className="title-md">Navigate</p>
            <button
              className="inline-flex size-9 items-center justify-center rounded-lg transition hover:bg-surface-container-low"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="space-y-2 px-5 pb-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-base text-muted-foreground transition hover:bg-surface-container-low hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="grid gap-2 px-5 pb-7">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-outline-variant/40",
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "gradient-brand text-primary-foreground shadow-[var(--shadow-ambient-sm)]",
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
