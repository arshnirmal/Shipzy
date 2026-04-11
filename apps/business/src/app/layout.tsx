import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";

import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const headingFont = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shipzy Business | The Next Era of Logistics",
  description:
    "Streamline last-mile operations with intelligent route optimization and scalable fleet management.",
  metadataBase: new URL("https://business.shipzy.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Shipzy Business | The Next Era of Logistics",
    description:
      "Streamline last-mile operations with intelligent route optimization and scalable fleet management.",
    url: "/",
    siteName: "Shipzy Business",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shipzy Business | The Next Era of Logistics",
    description:
      "Streamline last-mile operations with intelligent route optimization and scalable fleet management.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
