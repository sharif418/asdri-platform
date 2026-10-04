import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getLang } from "@/lib/i18n-server";
import { db } from "@/lib/db";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  title: "অ্যাডমিন প্যানেল",
  description: "আস-সুন্নাহ ইনস্টিটিউট কনটেন্ট অ্যাডমিন — নোটিশ, ফতোয়া ও সাইট ব্যবস্থাপনা।",
  robots: { index: false, follow: false },
};

/**
 * Admin gate + shell. Every /admin/* page renders inside this layout, so the
 * session guard here protects the whole area (non-admins are bounced to /login).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/login");

  const lang = await getLang();
  const unreadMessages = await db.contactMessage.count({ where: { status: "new" } });

  return (
    <div className="min-h-screen">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        {lang === "bn" ? "মূল কনটেন্টে যান" : "Skip to main content"}
      </a>

      <AdminSidebar lang={lang} admin={{ name: session.name, email: session.email }} unreadMessages={unreadMessages} />

      <div className="relative lg:pl-64">
        {/* Subtle Islamic lattice ornament fading into the ivory background */}
        <div
          aria-hidden
          className="pattern-lattice-light pointer-events-none absolute inset-x-0 top-0 h-48 opacity-80 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        <main
          id="admin-main"
          className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
