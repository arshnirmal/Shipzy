import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";

import { Suspense } from "react";

import { AppProviders } from "@/providers/app-providers";
import { AuthModal } from "@/components/auth/auth-modal";

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
  icons: {
    icon: "/app_logo.svg",
    apple: "/app_logo.png",
  },
  title: "Shipzy | The Next Era of Logistics",
  description:
    "Streamline last-mile operations with intelligent route optimization and scalable fleet management.",
  metadataBase: new URL("https://business.shipzy.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Shipzy | The Next Era of Logistics",
    description:
      "Streamline last-mile operations with intelligent route optimization and scalable fleet management.",
    url: "/",
    siteName: "Shipzy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shipzy | The Next Era of Logistics",
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
        <AppProviders>
          <Suspense fallback={null}>
            <AuthModal />
          </Suspense>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
