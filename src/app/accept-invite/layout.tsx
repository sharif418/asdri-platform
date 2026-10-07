import type { Metadata } from "next";
import type { ReactNode } from "react";
import { InstituteLogo } from "@/components/shared/logo";
import { brand } from "@/lib/brand";
import "../globals.css";

export const metadata: Metadata = {
  title: `অ্যাকাউন্ট চালু করুন | ${brand.shortBn}`,
  description: "আস-সুন্নাহ ইনস্টিটিউটের আমন্ত্রিত অ্যাকাউন্ট চালু করুন।",
  robots: { index: false, follow: false },
};

/**
 * Root shell for the invitation-acceptance page — its own <html> (Bangla,
 * outside the public site's [lang] tree and the admin's), consistent with
 * the admin layout's approach.
 */
export default function AcceptInviteRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" data-lang="bn" suppressHydrationWarning>
      <body className="bg-emerald-deep antialiased">
        <div className="pattern-lattice-light fixed inset-0 opacity-60" aria-hidden />
        <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
          <div className="mb-8 text-center">
            <InstituteLogo tone="on-dark" className="mx-auto h-16" />
            <p className="mt-3 text-[13px] font-semibold tracking-wide text-gold">{brand.shortBn}</p>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
