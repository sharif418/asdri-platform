import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession, isStaff } from "@/lib/auth";
import { AdminLogoutButton } from "@/components/auth/admin-logout-button";
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
 * site root). Session gate: every /admin/* page renders inside this layout,
 * so staff authentication is enforced before any admin page loads.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || !isStaff(session.user.role)) redirect("/login");

  const unreadMessages = await db.contactMessage.count({ where: { isRead: false } });

  return (
    <html lang="bn" data-lang="bn" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <div className="min-h-screen">
          <a
            href="#admin-main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
          >
            মূল কনটেন্টে যান
          </a>
          <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
            <div className="container-site flex h-14 items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <InstituteLogo className="h-8 w-8" />
                <div className="leading-tight">
                  <p className="font-heading text-sm font-bold">অ্যাডমিন প্যানেল</p>
                  <p className="text-[11px] text-muted-foreground">
                    আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {session.user.name} · {session.user.email}
                </span>
                <AdminLogoutButton />
              </div>
            </div>
          </header>
          <main id="admin-main" className="flex-1">
            {children}
          </main>
          <footer className="border-t py-4">
            <div className="container-site flex items-center justify-between text-[11px] text-muted-foreground">
              <span>অগ্রাধিকার বার্তা: {unreadMessages} টি অপঠিত</span>
              <span>ASDRI প্ল্যাটফর্ম v2</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
