import Link from "next/link";
import Image from "next/image";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Analytics", href: "/dashboard" },
      { label: "Integrations", href: "/settings" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Guides", href: "#how-it-works" },
      { label: "API Docs", href: "#" },
      { label: "Help Center", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-surface-container-low py-16" aria-label="Footer">
      <div className="container-shell">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-1">
            <div className="flex items-center gap-2">
              <Image src="/app_logo.svg" alt="Shipzy" width={28} height={28} />
              <p className="title-md">Shipzy</p>
            </div>
            <p className="body-sm text-muted-foreground">
              Manage orders, teams, and delivery performance in one place.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title} className="space-y-3">
              <p className="title-sm text-on-surface">{column.title}</p>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="body-sm link-clean">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 text-sm text-muted-foreground">
          © 2026 Shipzy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
