"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#cta", label: "Get started" },
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
            "flex items-center justify-between rounded-lg px-4 py-3 transition-all md:px-6",
            isScrolled
              ? "glass-panel ring-1 ring-outline-variant/20"
              : "bg-transparent ring-1 ring-transparent",
          )}
        >
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/app_logo.svg"
              alt="Shipzy"
              width={36}
              height={36}
              className="shrink-0"
            />
            <p className="title-sm leading-tight">Shipzy</p>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 md:flex"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="body-sm link-clean rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="?auth=login"
              className={cn(buttonVariants({ variant: "ghost", size: "touch" }))}
              scroll={false}
            >
              Sign in
            </Link>
            <Link
              href="?auth=register"
              className={cn(
                buttonVariants({ size: "touch" }),
                "gradient-brand text-primary-foreground shadow-[var(--shadow-ambient-sm)]",
              )}
              scroll={false}
            >
              Get Started
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-foreground transition hover:bg-surface-container-low focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:hidden"
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent
          id="mobile-navigation"
          side="right"
          className="w-[85%] border-none bg-surface-container-lowest p-0 sm:max-w-xs"
        >
          <div className="flex items-center justify-between p-5">
            <p className="title-md">Navigate</p>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition hover:bg-surface-container-low focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
                className="block rounded-lg px-3 py-2 text-base text-muted-foreground transition hover:bg-surface-container-low hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="grid gap-2 px-5 pb-7">
            <Link
              href="?auth=login"
              className={cn(
                buttonVariants({ variant: "outline", size: "touch" }),
                "border-outline-variant/20",
              )}
              onClick={() => setIsMenuOpen(false)}
              scroll={false}
            >
              Sign in
            </Link>
            <Link
              href="?auth=register"
              className={cn(
                buttonVariants({ size: "touch" }),
                "gradient-brand text-primary-foreground shadow-[var(--shadow-ambient-sm)]",
              )}
              onClick={() => setIsMenuOpen(false)}
              scroll={false}
            >
              Get Started
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
