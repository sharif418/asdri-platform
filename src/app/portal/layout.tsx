import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isStaff, isPortalRole, ROLE_LABELS_BN } from "@/lib/permissions";
import { LogoTextLockup } from "@/components/shared/logo";
import { brand } from "@/lib/brand";
import { Toaster } from "@/components/ui/toaster";
import { AdminLogoutButton } from "@/components/auth/admin-logout-button";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: `পোর্টাল | ${brand.shortBn}`,
    template: `%s | পোর্টাল — ${brand.shortBn}`,
  },
  description: "শিক্ষার্থী, অভিভাবক, শিক্ষক ও দাতাদের নিজস্ব পোর্টাল।",
  robots: { index: false, follow: false },
};

/**
 * The portal — one door, one responsibility each. Staff roles are sent to
 * the admin (their door); applicants keep /account; everyone else lands on
 * their portal home. The shell is deliberately calm: the brand, who you are,
 * and a way out.
 */
export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (isStaff(session.user.role)) redirect("/admin");
  if (session.user.role === "APPLICANT") redirect("/account");
  if (!isPortalRole(session.user.role)) redirect("/");

  return (
    <html lang="bn" data-lang="bn" suppressHydrationWarning>
      <body className="antialiased bg-background">
        <div className="flex min-h-screen flex-col">
          <a
            href="#portal-main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
          >
            মূল কনটেন্টে যান
          </a>
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
            <div className="container-site flex h-16 items-center justify-between gap-4">
              <Link href="/portal" aria-label={`${brand.shortBn} — পোর্টাল`}>
                <LogoTextLockup lang="bn" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="text-right leading-tight">
                  <p className="text-[13.5px] font-semibold">{session.user.name}</p>
                  <p className="text-[11px] font-medium text-gold">{ROLE_LABELS_BN[session.user.role]}</p>
                </div>
                <AdminLogoutButton />
              </div>
            </div>
          </header>
          <main id="portal-main" className="flex-1 bg-muted/20">
            {children}
          </main>
          <footer className="border-t bg-emerald-deep py-4 text-center text-[11.5px] text-ivory/70">
            {brand.shortBn} · সাঁতারকুল, বাড্ডা, ঢাকা
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
