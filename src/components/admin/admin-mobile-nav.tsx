"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Newspaper } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ADMIN_NAV } from "@/components/admin/admin-sidebar";
import { useFeatureFlags } from "@/components/providers/site-config-provider";
import { toBnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

/**
 * Mobile navigation for the admin shell (round 4, C1). Phones (< lg) have no
 * sidebar — this right-side Sheet lists the SAME tree the sidebar renders
 * (roles + feature-flag filtered, inbox unread badge), closing on navigation
 * (usePathname effect covers browser back/forward; links close it directly)
 * and on Escape (Radix Dialog behaviour).
 */
export function AdminMobileNav({ role, unread }: { role: UserRole; unread: number }) {
  const pathname = usePathname();
  const flags = useFeatureFlags();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const visible = ADMIN_NAV.filter((item) => {
    if (item.roles && !item.roles.includes(role)) return false;
    if (item.flag && flags[item.flag] === false) return false;
    return true;
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="অ্যাডমিন মেনু খুলুন"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-foreground transition-colors hover:bg-secondary"
        >
          <Menu aria-hidden className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[300px] flex-col gap-0 overflow-y-auto p-0 sm:w-[320px]">
        <div className="border-b bg-sidebar px-5 py-4">
          <SheetTitle className="text-left font-heading text-sm font-bold text-sidebar-foreground">অ্যাডমিন নেভিগেশন</SheetTitle>
          <p className="mt-0.5 text-[11px] text-sidebar-foreground/70">আস-সুন্নাহ ইনস্টিটিউট</p>
        </div>
        <nav aria-label="অ্যাডমিন নেভিগেশন" className="flex-1 px-3 py-3">
          <ul className="space-y-0.5">
            {visible.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <item.icon aria-hidden className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.href === "/admin/inbox" && unread > 0 && (
                      <span className="ml-auto rounded-full bg-gold px-1.5 text-[10px] font-bold text-gold-foreground">
                        {toBnDigits(unread)}
                      </span>
                    )}
                  </Link>
                  {item.children ? (
                    <ul className="mt-0.5 ml-5 space-y-0.5 border-l-2 border-gold/40 pl-3">
                      {item.children.map((child) => {
                        const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "block rounded-md px-3 py-2 text-[12.5px] transition-colors",
                                childActive ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t p-3">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Newspaper aria-hidden className="h-4 w-4" />
            ওয়েবসাইট দেখুন
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
