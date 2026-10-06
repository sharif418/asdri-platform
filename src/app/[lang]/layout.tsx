import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import ReactDOM from "react-dom";
import { criticalFontHrefs } from "@/lib/fonts";
import "../globals.css";

// Public pages render on request: the image is built before the database exists.
export const dynamic = "force-dynamic";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/components/providers/language-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";
import { isLang, type Lang } from "@/lib/locale";
import { env } from "@/lib/env";
import { siteConfig } from "@/content/site";

export function generateStaticParams(): Array<{ lang: string }> {
  return [{ lang: "bn" }, { lang: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang: Lang = isLang(raw) ? raw : "bn";
  const isBn = lang === "bn";

  return {
    metadataBase: new URL(env.siteUrl),
    title: {
      default: isBn
        ? `${siteConfig.nameBn} — ${siteConfig.parentBn}`
        : `${siteConfig.nameEn} — ${siteConfig.parentEn}`,
      template: isBn ? `%s | ${siteConfig.nameBn}` : `%s | ${siteConfig.nameEn}`,
    },
    description: isBn ? siteConfig.taglineBn : siteConfig.taglineEn,
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
      title: isBn ? siteConfig.nameBn : siteConfig.nameEn,
      description: isBn ? siteConfig.taglineBn : siteConfig.taglineEn,
      type: "website",
      locale: isBn ? "bn_BD" : "en_US",
      siteName: siteConfig.nameEn,
      images: [{ url: "/images/hero-campus.png", width: 1344, height: 768, alt: siteConfig.nameEn }],
    },
    twitter: {
      card: "summary_large_image",
      title: isBn ? siteConfig.nameBn : siteConfig.nameEn,
      description: isBn ? siteConfig.taglineBn : siteConfig.taglineEn,
      images: ["/images/hero-campus.png"],
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: isBn ? env.siteUrl : `${env.siteUrl}/en`,
      languages: {
        bn: env.siteUrl,
        en: `${env.siteUrl}/en`,
        "x-default": env.siteUrl,
      },
      types: {
        "application/rss+xml": [{ url: "/feed.xml", title: `${siteConfig.nameBn} — নোটিশ বোর্ড` }],
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0e5940" },
    { media: "(prefers-color-scheme: dark)", color: "#0b2a24" },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * Site root layout — one real URL per language:
 * Bangla at the bare path (rewritten to /bn internally), English at /en.
 * The <html lang> and the CSS font bindings switch accordingly.
 */
export default async function SiteRootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  // Only the language-critical faces are preloaded (next/font used to eager-
  // preload every weight of every family on every page). Font requests are
  // CORS-mode, so crossorigin is required even same-origin.
  for (const href of criticalFontHrefs(lang)) {
    ReactDOM.preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }

  return (
    <html
      lang={lang === "bn" ? "bn" : "en"}
      data-lang={lang}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider>
          <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
        <Toaster />
      </body>
    </html>
  );
}
