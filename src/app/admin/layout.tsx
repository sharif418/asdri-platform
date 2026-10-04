import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession, isStaff } from "@/lib/auth";
import { getEnabledFlags } from "@/lib/settings";
import { getSiteConfig } from "@/lib/content/site";
import { SiteConfigProvider } from "@/components/providers/site-config-provider";
import { AdminLogoutButton } from "@/components/auth/admin-logout-button";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { InstituteLogo } from "@/components/shared/logo";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: {
    default: "অ্যাডমিন প্যানেল",
    template: "%s | অ্যাডমিন — আস-সুন্নাহ ইনস্টিটিউট",
  },
  description: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট কনটেন্ট ব্যবস্থাপনা প্যানেল।",
  robots: { index: false, follow: false },
};

/**
 * Admin root layout — its own <html> (Bangla-only, separate from the public
 * site root). Staff session gate: every /admin/* page renders inside this
 * layout, so authentication and the role/flag-aware sidebar apply globally.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || !isStaff(session.user.role)) redirect("/login");

  const [unreadMessages, flagMap, siteConfig] = await Promise.all([
    db.contactMessage.count({ where: { isRead: false } }),
    getEnabledFlags(),
    getSiteConfig(),
  ]);
  const flags = Object.fromEntries(flagMap);

  return (
    <html lang="bn" data-lang="bn" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <SiteConfigProvider config={siteConfig} flags={flags}>
        <div className="flex min-h-screen">
          <AdminSidebar role={session.user.role} unread={unreadMessages} />
          <div className="flex min-w-0 flex-1 flex-col">
            <a
              href="#admin-main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
            >
              মূল কনটেন্টে যান
            </a>
            <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur lg:hidden">
              <div className="flex h-14 items-center justify-between gap-4 px-4">
                <div className="flex items-center gap-3">
                  <InstituteLogo className="h-8 w-8" />
                  <div className="leading-tight">
                    <p className="font-heading text-sm font-bold">অ্যাডমিন প্যানেল</p>
                    <p className="text-[11px] text-muted-foreground">{session.user.name}</p>
                  </div>
                </div>
                <AdminLogoutButton />
              </div>
            </header>
            <header className="sticky top-0 z-40 hidden border-b bg-card/95 backdrop-blur lg:block">
              <div className="flex h-14 items-center justify-end gap-4 px-6">
                <span className="text-xs text-muted-foreground">
                  {session.user.name} · {session.user.email}
                </span>
                <AdminLogoutButton />
              </div>
            </header>
            <main id="admin-main" className="min-w-0 flex-1 bg-muted/20">
              {children}
            </main>
          </div>
        </div>
        </SiteConfigProvider>
      </body>
    </html>
  );
}
