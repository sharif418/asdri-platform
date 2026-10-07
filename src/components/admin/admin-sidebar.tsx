"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  BadgeCheck,
  Bell,
  BookOpenCheck,
  Boxes,
  CalendarCheck,
  ClipboardList,
  FileDown,
  Flag,
  HandCoins,
  Images,
  LayoutDashboard,
  ListChecks,
  Mail,
  Megaphone,
  MessageSquareQuote,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  ScrollText,
  Settings,
  UserCog,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeatureFlags } from "@/components/providers/site-config-provider";
import type { UserRole } from "@prisma/client";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  flag?: string;
  roles?: UserRole[];
  children?: { href: string; label: string }[];
}

/** Module tree — order is the sidebar's order. Roles gate whole sections. */
const NAV: AdminNavItem[] = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  {
    href: "/admin/notices",
    label: "নোটিশ বোর্ড",
    icon: Megaphone,
    flag: "notices",
    roles: ["ADMIN", "EDITOR"],
  },
  {
    href: "/admin/courses",
    label: "কোর্স ও সিলেবাস",
    icon: BookOpenCheck,
    roles: ["ADMIN", "EDITOR"],
  },
  {
    href: "/admin/people",
    label: "শিক্ষক ও কর্মকর্তা",
    icon: Users,
    roles: ["ADMIN", "EDITOR"],
  },
  {
    href: "/admin/blog",
    label: "ব্লগ ও আর্টিকেল",
    icon: PenLine,
    flag: "blog",
    roles: ["ADMIN", "EDITOR"],
  },
  {
    href: "/admin/gallery",
    label: "গ্যালারি",
    icon: Images,
    flag: "gallery",
    roles: ["ADMIN", "EDITOR"],
  },
  { href: "/admin/videos", label: "ভিডিও", icon: Video, flag: "videos", roles: ["ADMIN", "EDITOR"] },
  {
    href: "/admin/research",
    label: "গবেষণা ও প্রকাশনা",
    icon: ScrollText,
    flag: "research",
    roles: ["ADMIN", "EDITOR"],
    children: [
      { href: "/admin/research/publications", label: "জার্নাল ও বই" },
      { href: "/admin/research/projects", label: "গবেষণা প্রকল্প" },
      { href: "/admin/research/downloads", label: "ডাউনলোড আইটেম" },
    ],
  },
  {
    href: "/admin/fatwa",
    label: "ফতোয়া ব্যবস্থাপনা",
    icon: MessageSquareQuote,
    flag: "fatwa",
    roles: ["ADMIN", "FATWA", "EDITOR"],
    children: [
      { href: "/admin/fatwa/questions", label: "জিজ্ঞাসা ইনবক্স" },
      { href: "/admin/fatwa/entries", label: "ফতোয়া ব্যাংক" },
    ],
  },
  {
    href: "/admin/admissions",
    label: "ভর্তি ব্যবস্থাপনা",
    icon: ClipboardList,
    flag: "admissions",
    roles: ["ADMIN", "ADMISSIONS"],
    children: [
      { href: "/admin/admissions/intakes", label: "ইনটেক ও ব্যাচ" },
      { href: "/admin/admissions/applications", label: "আবেদনসমূহ" },
    ],
  },
  {
    href: "/admin/finance",
    label: "আর্থিক বিভাগ",
    icon: HandCoins,
    flag: "donations",
    roles: ["ADMIN", "FINANCE"],
    children: [
      { href: "/admin/finance/donations", label: "অনুদান তালিকা" },
      { href: "/admin/finance/campaigns", label: "ক্যাম্পেইন" },
      { href: "/admin/finance/funds", label: "ফান্ড" },
      { href: "/admin/finance/ledger", label: "ম্যানুয়াল লেজার" },
      { href: "/admin/finance/outbox", label: "আউটবক্স" },
    ],
  },
  {
    href: "/admin/content",
    label: "পেজ কনটেন্ট",
    icon: FileDown,
    roles: ["ADMIN", "EDITOR"],
    children: [
      { href: "/admin/content/home", label: "হোম সেকশন ও পরিসংখ্যান" },
      { href: "/admin/content/faqs", label: "সচরাচর প্রশ্ন" },
      { href: "/admin/content/admission", label: "ভর্তি প্রক্রিয়া ও স্কলারশিপ" },
    ],
  },
  {
    href: "/admin/media",
    label: "মিডিয়া লাইব্রেরি",
    icon: Archive,
    roles: ["ADMIN", "EDITOR", "ADMISSIONS", "FINANCE", "FATWA"],
  },
  {
    href: "/admin/inbox",
    label: "বার্তা ও সাবস্ক্রাইবার",
    icon: Mail,
    roles: ["ADMIN", "EDITOR", "ADMISSIONS"],
    children: [
      { href: "/admin/inbox/messages", label: "যোগাযোগ বার্তা" },
      { href: "/admin/inbox/subscribers", label: "নিউজলেটার" },
    ],
  },
  { href: "/admin/users", label: "ইউজার ও রোল", icon: UserCog, roles: ["ADMIN"] },
  { href: "/admin/audit", label: "অডিট লগ", icon: BadgeCheck, roles: ["ADMIN"] },
  {
    href: "/admin/settings",
    label: "সাইট সেটিংস",
    icon: Settings,
    roles: ["ADMIN"],
    children: [
      { href: "/admin/settings/identity", label: "পরিচিতি ও যোগাযোগ" },
      { href: "/admin/settings/menus", label: "নেভিগেশন মেনু" },
      { href: "/admin/settings/flags", label: "ফিচার ফ্ল্যাগ" },
    ],
  },
];

export function AdminSidebar({ role, unread }: { role: UserRole; unread: number }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const flags = useFeatureFlags();

  const visible = NAV.filter((item) => {
    if (item.roles && !item.roles.includes(role)) return false;
    if (item.flag && flags[item.flag] === false) return false;
    return true;
  });

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-all lg:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!collapsed && (
          <Link href="/admin" className="min-w-0">
            <p className="truncate font-heading text-sm font-bold">অ্যাডমিন প্যানেল</p>
            <p className="truncate text-[10.5px] text-muted-foreground">আস-সুন্নাহ ইনস্টিটিউট</p>
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "সাইডবার খুলুন" : "সাইডবার বন্ধ করুন"}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          {collapsed ? <PanelLeftOpen aria-hidden className="h-4 w-4" /> : <PanelLeftClose aria-hidden className="h-4 w-4" />}
        </button>
      </div>

      <nav aria-label="অ্যাডমিন নেভিগেশন" className="scrollbar-thin flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {visible.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
            const expanded = item.children?.some((c) => pathname.startsWith(c.href)) ?? active;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <item.icon aria-hidden className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.href === "/admin/inbox" && unread > 0 && (
                    <span className="ml-auto rounded-full bg-gold px-1.5 text-[10px] font-bold text-gold-foreground">
                      {unread}
                    </span>
                  )}
                </Link>
                {!collapsed && expanded && item.children && (
                  <ul className="mt-0.5 space-y-0.5 border-l-2 border-gold/40 pl-3 ml-5">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              "block rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors",
                              childActive ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="border-t p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Newspaper aria-hidden className="h-4 w-4" />
            ওয়েবসাইট দেখুন
          </Link>
        </div>
      )}
    </aside>
  );
}

export { NAV as ADMIN_NAV };
