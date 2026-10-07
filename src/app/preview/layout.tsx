import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: {
    default: `প্রিভিউ | ${brand.shortBn}`,
    template: `%s | প্রিভিউ — ${brand.shortBn}`,
  },
  description: "অপ্রকাশিত কনটেন্টের স্বল্পমেয়াদী প্রিভিউ — সার্চ ইঞ্জিনে আসে না।",
  // Previews are for people the office handed the link to — never search.
  robots: { index: false, follow: false },
};

/**
 * Root shell for /preview/<token> — its own <html> (Bangla, outside the
 * public site's [lang] tree), the same approach as accept-invite. No OG
 * article meta, no sitemap entry: the page renders drafts for human eyes
 * only (round 4, workstream 5).
 */
export default function PreviewRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" data-lang="bn" suppressHydrationWarning>
      <body className="antialiased bg-background">
        <div className="flex min-h-screen flex-col">
          <a
            href="#preview-main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
          >
            মূল কনটেন্টে যান
          </a>
          {children}
        </div>
      </body>
    </html>
  );
}
