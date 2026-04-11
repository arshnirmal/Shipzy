import Link from "next/link";

const footerColumns = [
  {
    title: "Product",
    links: ["Dashboard", "Analytics", "Integrations"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Contact"],
  },
  {
    title: "Resources",
    links: ["Guides", "API Docs", "Help Center"],
  },
  {
    title: "Legal",
    links: ["Terms", "Privacy", "Security"],
  },
];

export function Footer() {
  return (
    <footer className="bg-surface-container-low py-16">
      <div className="container-shell">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-1">
            <p className="title-md">Shipzy Business</p>
            <p className="body-sm text-muted-foreground">
              Editorial-grade operations platform for high-performance delivery
              teams.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title} className="space-y-3">
              <p className="title-sm text-on-surface">{column.title}</p>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="body-sm link-clean">
                      {link}
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
