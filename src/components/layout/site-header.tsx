"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartHandshake, Languages, Mail, MapPin, Phone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoLockup, LogoTextLockup } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CommandPalette } from "@/components/search/command-palette";
import { AccountChip } from "@/components/layout/header/account-chip";
import { NavDisclosure, type NavSectionView } from "@/components/layout/header/nav-disclosure";
import { NavDrawer } from "@/components/layout/header/nav-drawer";
import { useLanguage } from "@/components/providers/language-provider";
import { useSiteConfig, useSiteMenu, useModuleEnabled } from "@/components/providers/site-config-provider";
import { navigation } from "@/content/site";
import { langPath } from "@/lib/locale";
import type { DictionaryKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Resolve the nav sections: DB menus (office-edited) with the static seed
 *  navigation as fallback. Labels resolve per language; the flag filtering
 *  already happened server-side in the (site) layout. */
export function useNavSections(): NavSectionView[] {
  const { t, lang } = useLanguage();
  const menu = useSiteMenu();

  if (menu) {
    return menu.main.map((section) => ({
      label: lang === "bn" ? section.labelBn : section.labelEn || section.labelBn,
      href: section.href,
      children: section.children.map((child) => ({
        label: lang === "bn" ? child.labelBn : child.labelEn || child.labelBn,
        href: child.href,
      })),
    }));
  }

  const staticSections: { key: DictionaryKey; href: string; children: { key: DictionaryKey; href: string }[] }[] = [
    { key: "nav.about", href: "/about", children: [...navigation.about] },
    { key: "nav.academics", href: "/academics", children: [...navigation.academics] },
    { key: "nav.admissions", href: "/admissions", children: [...navigation.admissions] },
    { key: "nav.research", href: "/research", children: [...navigation.research] },
    { key: "nav.media", href: "/media", children: [...navigation.media] },
    { key: "nav.notices", href: "/notices", children: [...navigation.notices] },
    { key: "nav.contact", href: "/contact", children: [...navigation.contact] },
  ];
  return staticSections.map((section) => ({
    label: t(section.key),
    href: section.href,
    children: section.children.map((child) => ({ label: t(child.key), href: child.href })),
  }));
}

/** Internal pathnames are locale-prefixed (/bn/x, /en/x) — strip to compare. */
function displayPath(pathname: string): string {
  if (pathname.startsWith("/en")) return pathname.slice(3) || "/";
  if (pathname.startsWith("/bn")) return pathname.slice(3) || "/";
  return pathname;
}

/**
 * The utility bar: the institute's everyday contact, the language switch and
 * the theme. It scrolls away with the page — only the main bar sticks, so
 * reading space is never taxed by chrome the reader has already passed.
 */
function TopUtilityBar() {
  const { lang, toggle } = useLanguage();
  const siteConfig = useSiteConfig();
  return (
    <div className="bg-emerald-deep text-ivory/90">
      <div className="container-site flex h-10 items-center justify-between gap-4 text-[12px] sm:text-[13px]">
        <div className="flex min-w-0 items-center gap-4">
          <a
            href={siteConfig.phoneHref}
            className="hidden items-center gap-1.5 transition-colors hover:text-gold min-[420px]:inline-flex"
          >
            <Phone aria-hidden className="h-3.5 w-3.5 text-gold" />
            <span dir="ltr">
              {lang === "bn" ? "সকাল ৯টা–বিকাল ৫টা" : "9AM–5PM"} | {siteConfig.phone}
            </span>
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="hidden items-center gap-1.5 transition-colors hover:text-gold lg:inline-flex"
          >
            <Mail aria-hidden className="h-3.5 w-3.5 text-gold" />
            <span className="truncate">{siteConfig.email}</span>
          </a>
          <span className="inline-flex items-center gap-1.5 min-[420px]:hidden">
            <MapPin aria-hidden className="h-3.5 w-3.5 text-gold" />
            <span className="truncate">{lang === "bn" ? "সাঁতারকুল, বাড্ডা, ঢাকা" : "Satarkul, Badda, Dhaka"}</span>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={toggle}
            className="inline-flex min-h-8 items-center gap-1 rounded-full border border-ivory/25 px-2.5 font-medium tracking-wide transition-colors hover:border-gold hover:text-gold"
            aria-label={lang === "bn" ? "EN | বাং — switch to English" : "EN | বাং — বাংলায় দেখুন"}
          >
            <Languages aria-hidden className="h-3.5 w-3.5" />
            <span className={cn("text-[11px]", lang === "bn" ? "opacity-60" : "font-bold text-gold")}>EN</span>
            <span aria-hidden className="opacity-40">|</span>
            <span className={cn("text-[11px]", lang === "en" ? "opacity-60" : "font-bold text-gold")}>বাং</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The site header, designed as one piece:
 *
 *   utility bar (scrolls away) → contact + theme + language
 *   main bar (sticky)          → brand | navigation | search + account + donate
 *   drawer (below xl)          → the whole nav for phones and laptops
 *
 * Brand sizing follows the rules in src/lib/brand.ts: the full calligraphic
 * lockup only where it renders at or above its legible height (xl+ here);
 * tighter bars carry the official mark beside the institute's typeset name.
 */
export function SiteHeader() {
  const { t, lang } = useLanguage();
  const navSections = useNavSections();
  const donationsEnabled = useModuleEnabled("donations");
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = displayPath(usePathname());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        {lang === "bn" ? "মূল কনটেন্টে যান" : "Skip to content"}
      </a>
      <header className="w-full">
        <TopUtilityBar />
        <div
          className={cn(
            "sticky top-0 z-50 overflow-x-clip border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85",
            "transition-[box-shadow,border-color] duration-200",
            scrolled ? "border-border shadow-md shadow-emerald-950/5" : "border-transparent",
          )}
        >
          <div
            className={cn(
              "container-site flex items-center justify-between gap-3 transition-[height] duration-200 lg:gap-4",
              scrolled ? "h-14 lg:h-16" : "h-16 lg:h-[76px]",
            )}
          >
            {/* Brand: the full calligraphic lockup only where it renders wide
                enough to stay legible (2xl+); tighter bars carry the official
                mark beside the institute's typeset name */}
            <Link
              href={langPath(lang, "/")}
              aria-label={lang === "bn" ? "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট — হোম" : "As-Sunnah Dawah & Research Institute — home"}
              className="shrink-0"
            >
              <LogoLockup priority className="hidden h-12 2xl:block" />
              <LogoTextLockup lang={lang} priority className="2xl:hidden" markClassName={scrolled ? "h-8" : "h-9"} />
            </Link>

            {/* Desktop navigation (xl+): parent click navigates; chevron opens the panel.
                Condensed at xl (1280–1535) — English labels are a third longer than
                Bangla and must fit beside the brand without ever squeezing it. */}
            <nav aria-label={t("a11y.mainNav")} className="hidden xl:block">
              <ul className="flex items-center gap-0 2xl:gap-0.5">
                <li className="relative">
                  <Link
                    href={langPath(lang, "/")}
                    aria-current={pathname === "/" ? "page" : undefined}
                    className={cn(
                      "link-sweep block whitespace-nowrap rounded-md px-2 py-2 text-[12.5px] font-medium transition-colors hover:text-primary 2xl:px-3 2xl:text-[14px]",
                      pathname === "/" && "font-semibold text-primary",
                    )}
                  >
                    {t("nav.home")}
                  </Link>
                  {pathname === "/" ? (
                    <span aria-hidden className="bg-gold-gradient absolute inset-x-3 bottom-0 h-0.5 rounded-full" />
                  ) : null}
                </li>
                {navSections.map((section, index) => (
                  <li key={section.href}>
                    <NavDisclosure
                      section={section}
                      active={pathname === section.href || pathname.startsWith(`${section.href}/`)}
                      align={index >= navSections.length - 2 ? "right" : "left"}
                    />
                  </li>
                ))}
              </ul>
            </nav>

            {/* Actions: search, account, donate */}
            <div className="flex shrink-0 items-center gap-1.5 lg:gap-2 2xl:gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setSearchOpen(true)}
                aria-label={t("search.placeholder")}
                className="hidden h-10 w-10 rounded-full lg:inline-flex"
              >
                <Search aria-hidden className="h-4 w-4 text-primary" />
              </Button>
              <AccountChip />
              {donationsEnabled ? (
                <Button
                  asChild
                  size="sm"
                  className="hidden bg-gold-gradient text-[13px] font-semibold text-gold-foreground shadow-sm hover:opacity-95 sm:inline-flex"
                >
                  <Link href={langPath(lang, "/support")}>
                    <HeartHandshake aria-hidden className="h-4 w-4" />
                    {t("action.donate")}
                  </Link>
                </Button>
              ) : null}
              <NavDrawer sections={navSections} onSearchClick={() => setSearchOpen(true)} />
            </div>
          </div>
        </div>
      </header>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
