import type { Metadata, Viewport } from "next";
import { Amiri, Cormorant_Garamond, Hind_Siliguri, Tiro_Bangla } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/components/providers/language-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";
import { getLang } from "@/lib/i18n-server";
import { siteConfig } from "@/content/site";

const tiroBangla = Tiro_Bangla({
  variable: "--font-heading",
  subsets: ["bengali", "latin"],
  weight: "400",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-body",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-latin-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

/** Canonical site origin — env override wins when set (used for metadataBase, sitemap, robots, feed). */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://assunnahinstitute.org";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.nameBn} | ${siteConfig.nameEn}`,
    template: `%s | ${siteConfig.nameBn}`,
  },
  description: siteConfig.taglineBn,
  keywords: [
    "আস-সুন্নাহ",
    "দাওয়াহ",
    "ইসলামিক রিসার্চ",
    "As-Sunnah",
    "Dawah Institute",
    "Islamic Studies",
    "PYS",
    "CCIS",
    "Bangladesh",
  ],
  authors: [{ name: siteConfig.nameEn }],
  openGraph: {
    title: siteConfig.nameBn,
    description: siteConfig.taglineBn,
    type: "website",
    locale: "bn_BD",
    siteName: siteConfig.nameEn,
    images: [{ url: "/images/hero-campus.png", width: 1344, height: 768, alt: siteConfig.nameEn }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.nameBn,
    description: siteConfig.taglineBn,
    images: ["/images/hero-campus.png"],
  },
  robots: { index: true, follow: true },
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: `${siteConfig.nameBn} — নোটিশ বোর্ড` }],
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0e5940" },
    { media: "(prefers-color-scheme: dark)", color: "#0b2a24" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getLang();

  return (
    <html
      lang={lang === "bn" ? "bn" : "en"}
      data-lang={lang}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className={`${tiroBangla.variable} ${hindSiliguri.variable} ${amiri.variable} ${cormorant.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
        <Toaster />
      </body>
    </html>
  );
}
