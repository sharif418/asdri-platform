"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Languages, LogIn, Mail, MapPin, Phone, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogoLockup } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useLanguage } from "@/components/providers/language-provider";
import { useSiteConfig } from "@/components/providers/site-config-provider";
import { langPath } from "@/lib/locale";
import { cn } from "@/lib/utils";
import type { NavSectionView } from "./nav-disclosure";

/** Strip the internal locale prefix for active-state comparison. */
function displayPath(pathname: string): string {
  if (pathname.startsWith("/en")) return pathname.slice(3) || "/";
  if (pathname.startsWith("/bn")) return pathname.slice(3) || "/";
  return pathname;
}

/**
 * The drawer that serves every width below xl — phones and laptops alike.
 * Same semantics as the desktop bar: tapping a section's name navigates to
 * its landing page; the chevron is a separate expander for its children.
 */
export function NavDrawer({
  sections,
  onSearchClick,
}: {
  sections: NavSectionView[];
  onSearchClick: () => void;
}) {
  const { t, lang, toggle } = useLanguage();
  const siteConfig = useSiteConfig();
  const pathname = displayPath(usePathname());
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  function close() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("a11y.openMenu")}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-secondary xl:hidden"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 5.5h14M3 10h14M3 14.5h9" strokeLinecap="round" />
          </svg>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-[320px] flex-col gap-0 overflow-y-auto p-0 sm:w-[360px]"
      >
        <div className="border-b bg-emerald-deep px-5 pb-5 pt-4">
          <SheetTitle className="text-left">
            <LogoLockup tone="on-dark" className="h-12" />
          </SheetTitle>
          <p className="mt-2 text-[11.5px] text-ivory/70">
            {lang === "bn" ? "আস-সুন্নাহ ফাউন্ডেশনের একটি শিক্ষাপ্রতিষ্ঠান" : "An educational institution of As-Sunnah Foundation"}
          </p>
        </div>

        <nav aria-label={t("a11y.mobileNav")} className="flex-1 px-4 py-4">
          <button
            type="button"
            onClick={() => {
              close();
              onSearchClick();
            }}
            className="mb-3 flex min-h-11 w-full items-center gap-2.5 rounded-lg border border-gold/40 bg-gold-soft/30 px-3.5 text-[14px] font-medium text-foreground transition-colors hover:border-gold"
          >
            <Search aria-hidden className="h-4 w-4 text-primary" />
            {t("search.placeholder")}
          </button>

          <Link
            href={langPath(lang, "/")}
            onClick={close}
            className={cn(
              "block rounded-md px-3 py-2.5 text-[15px] font-medium hover:bg-secondary",
              pathname === "/" && "bg-secondary text-primary",
            )}
          >
            {t("nav.home")}
          </Link>

          <ul className="mt-1">
            {sections.map((section) => {
              const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
              const isOpen = expanded === section.href;
              const hasChildren = section.children.length > 0;
              return (
                <li key={section.href} className="border-b border-border/60 last:border-b-0">
                  <div className="flex items-center">
                    <Link
                      href={langPath(lang, section.href)}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex-1 py-3 text-[15px] font-medium hover:text-primary",
                        active && "text-primary",
                      )}
                    >
                      {section.label}
                    </Link>
                    {hasChildren ? (
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-label={`${section.label} — ${lang === "bn" ? "সাব-মেনু" : "submenu"}`}
                        onClick={() => setExpanded(isOpen ? null : section.href)}
                        className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                      >
                        <ChevronDown
                          aria-hidden
                          className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")}
                        />
                      </button>
                    ) : null}
                  </div>
                  {hasChildren && isOpen ? (
                    <ul className="grid gap-0.5 border-l-2 border-gold/40 pb-3 pl-4">
                      {section.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={langPath(lang, child.href)}
                            onClick={close}
                            className="block rounded-md px-3 py-2 text-[13.5px] text-muted-foreground hover:bg-secondary hover:text-primary"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className="mt-6 grid gap-2">
            <Button asChild variant="outline" className="min-h-11 justify-start">
              <Link href={langPath(lang, "/login")} onClick={close}>
                <LogIn aria-hidden className="h-4 w-4" />
                {t("action.login")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11 justify-start">
              <Link href={langPath(lang, "/register")} onClick={close}>
                <UserPlus aria-hidden className="h-4 w-4" />
                {t("action.register")}
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="min-h-11 justify-start text-muted-foreground"
              onClick={() => {
                toggle();
                close();
              }}
            >
              <Languages aria-hidden className="h-4 w-4" />
              {lang === "bn" ? "Switch to English" : "বাংলায় দেখুন"}
            </Button>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-[12.5px] text-muted-foreground">
                {lang === "bn" ? "থিম" : "Theme"}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <div className="border-t bg-parchment px-5 py-4 text-xs text-muted-foreground dark:bg-secondary/40">
          <p className="flex items-center gap-1.5">
            <Phone aria-hidden className="h-3.5 w-3.5 text-gold" />
            <span dir="ltr">{siteConfig.phone}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5">
            <Mail aria-hidden className="h-3.5 w-3.5 text-gold" />
            <span className="truncate">{siteConfig.email}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5">
            <MapPin aria-hidden className="h-3.5 w-3.5 text-gold" />
            {lang === "bn" ? siteConfig.addressBn : siteConfig.addressEn}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
