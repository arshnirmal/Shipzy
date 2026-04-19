import Link from "next/link";
import Image from "next/image";

const productLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Analytics", href: "/analytics" },
  { label: "Orders", href: "/orders" },
  { label: "Settings", href: "/settings" },
];

const resourceLinks = [{ label: "How it works", href: "#how-it-works" }];

export function Footer() {
  return (
    <footer className="bg-surface-container-low py-16" aria-label="Footer">
      <div className="container-shell">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 lg:col-span-1">
            <div className="flex items-center gap-2">
              <Image src="/app_logo.svg" alt="Shipzy" width={28} height={28} />
              <p className="title-md">Shipzy</p>
            </div>
            <p className="body-sm text-muted-foreground">
              Manage orders, teams, and delivery performance in one place.
            </p>
          </div>

          <div className="space-y-3">
            <p className="title-sm text-on-surface">Product</p>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="body-sm link-clean">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="title-sm text-on-surface">Resources</p>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="body-sm link-clean">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="title-sm text-on-surface">Contact</p>
            <p className="body-sm text-muted-foreground">
              Questions about Shipzy for business?{" "}
              <a
                href="mailto:hello@shipzy.app"
                className="link-clean font-medium text-foreground underline-offset-4 hover:underline"
              >
                hello@shipzy.app
              </a>
            </p>
          </div>
        </div>

        <div className="mt-14 pt-2 text-sm text-muted-foreground">
          © 2026 Shipzy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
