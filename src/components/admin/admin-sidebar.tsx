"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HandHeart, History, Inbox, LayoutDashboard, Megaphone, Menu, MessageSquareText, ShieldCheck, Target, Users } from "lucide-react";
import { LogoLockup } from "@/components/shared/logo";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/content/site";
import { cn } from "@/lib/utils";
import { toBnDigits } from "@/lib/format";
import type { Language } from "@/types";

interface AdminSidebarProps {
  lang: Language;
  admin: { name: string; email: string };
  unreadMessages?: number;
}

interface NavItem {
  href: string;
  labelBn: string;
  labelEn: string;
  icon: typeof LayoutDashboard;
  exact: boolean;
}

interface NavSection {
  key: string;
  labelBn: string;
  labelEn: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    key: "ops",
    labelBn: "কনটেন্ট",
    labelEn: "Content",
    items: [
      { href: "/admin", labelBn: "ড্যাশবোর্ড", labelEn: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/notices", labelBn: "নোটিশ ব্যবস্থাপনা", labelEn: "Notice Management", icon: Megaphone, exact: false },
      { href: "/admin/fatwa", labelBn: "ফতোয়া মডারেশন", labelEn: "Fatwa Moderation", icon: MessageSquareText, exact: false },
    ],
  },
  {
    key: "engage",
    labelBn: "সম্পৃক্ততা",
    labelEn: "Engagement",
    items: [
      { href: "/admin/messages", labelBn: "যোগাযোগ বার্তাবক্স", labelEn: "Contact Inbox", icon: Inbox, exact: false },
      { href: "/admin/subscribers", labelBn: "নিউজলেটার সাবস্ক্রাইবার", labelEn: "Newsletter Subscribers", icon: Users, exact: false },
      { href: "/admin/donations", labelBn: "অনুদান খাতাবহি", labelEn: "Donation Ledger", icon: HandHeart, exact: false },
      { href: "/admin/campaigns", labelBn: "ক্যাম্পেইন ব্যবস্থাপনা", labelEn: "Campaign Management", icon: Target, exact: false },
    ],
  },
  {
    key: "system",
    labelBn: "সিস্টেম",
    labelEn: "System",
    items: [
      { href: "/admin/audit", labelBn: "কার্যক্রম লগ", labelEn: "Activity Log", icon: History, exact: false },
    ],
  },
];

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/* ————————— Shared sidebar body (desktop aside + mobile drawer) ————————— */

function SidebarBody({ lang, admin, unreadMessages = 0, onNavigate }: AdminSidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const bn = lang === "bn";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Brand lockup */}
      <div className="px-4 pb-4 pt-5">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-gold"
          aria-label={siteConfig.nameBn}
        >
          <LogoLockup
            nameBn={siteConfig.nameBn}
            nameEn={siteConfig.nameEn}
            parentBn={siteConfig.parentBn}
            tone="on-dark"
            className="w-full"
          />
        </Link>
      </div>

      <div aria-hidden className="mx-4 h-px bg-gradient-to-r from-gold/50 via-gold/20 to-transparent" />

      {/* Primary nav */}
      <nav aria-label={bn ? "অ্যাডমিন নেভিগেশন" : "Admin navigation"} className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.key} className="space-y-1.5">
            <p className="px-3 pb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ivory/40">
              {bn ? section.labelBn : section.labelEn}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13.5px] font-semibold transition-colors",
                    active
                      ? "bg-gold/15 text-gold"
                      : "text-ivory/70 hover:bg-white/5 hover:text-ivory",
                  )}
                >
                  {active ? (
                    <span aria-hidden className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-gold-gradient" />
                  ) : null}
                  <Icon aria-hidden className="h-4.5 w-4.5 shrink-0" />
                  <span className="min-w-0 flex-1">{bn ? item.labelBn : item.labelEn}</span>
                  {item.href === "/admin/messages" && unreadMessages > 0 ? (
                    <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold/20 px-2 py-0.5 text-[10.5px] font-bold text-gold">
                      <span aria-hidden className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/70" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                      </span>
                      {toBnDigits(unreadMessages)}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Back to public site */}
        <div className="pt-1">
          <div aria-hidden className="mx-1 mb-2 h-px bg-ivory/10" />
          <Link
            href="/"
            onClick={onNavigate}
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium text-ivory/60 transition-colors hover:bg-white/5 hover:text-ivory"
          >
            <span aria-hidden className="font-arabic text-base leading-none text-gold/80">﴿﴾</span>
            {bn ? "ওয়েবসাইটে ফিরে যান" : "Back to website"}
          </Link>
        </div>
      </nav>

      {/* Admin identity chip */}
      <div className="mt-auto space-y-1 px-3 pb-4">
        <div aria-hidden className="mx-1 h-px bg-ivory/10" />
        <div className="rounded-xl border border-gold/25 bg-gold/10 p-3">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
              <ShieldCheck className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-ivory">{admin.name}</p>
              <p dir="ltr" className="truncate text-[11px] text-ivory/60">
                {admin.email}
              </p>
            </div>
          </div>
          <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-gold">
            {bn ? "অ্যাডমিন · সম্পূর্ণ অ্যাক্সেস" : "Admin · Full access"}
          </p>
        </div>
        <AdminLogoutButton lang={lang} />
      </div>
    </div>
  );
}

/* ————————— Responsive shell: fixed desktop rail + mobile drawer ————————— */

export function AdminSidebar({ lang, admin, unreadMessages = 0 }: AdminSidebarProps) {
  const bn = lang === "bn";

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-emerald-deep shadow-xl lg:flex">
        <div aria-hidden className="pattern-lattice-light pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative h-full min-h-0">
          <SidebarBody lang={lang} admin={admin} unreadMessages={unreadMessages} />
        </div>
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-40 flex min-h-14 items-center gap-3 border-b border-gold/20 bg-emerald-deep px-3 py-2 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label={bn ? "অ্যাডমিন মেনু খুলুন" : "Open admin menu"}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-ivory transition-colors hover:bg-white/10"
            >
              <Menu aria-hidden className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-gold/20 bg-emerald-deep p-0 text-ivory">
            <SheetHeader className="sr-only">
              <SheetTitle>{bn ? "অ্যাডমিন নেভিগেশন" : "Admin navigation"}</SheetTitle>
              <SheetDescription>{siteConfig.nameBn}</SheetDescription>
            </SheetHeader>
            <SidebarBody lang={lang} admin={admin} unreadMessages={unreadMessages} />
          </SheetContent>
        </Sheet>
        <p className="font-heading text-[15px] font-semibold text-ivory">
          {bn ? "অ্যাডমিন প্যানেল" : "Admin Panel"}
        </p>
        <span aria-hidden className="ml-auto font-arabic text-sm text-gold/80">السُّنَّة</span>
      </header>
    </>
  );
}
