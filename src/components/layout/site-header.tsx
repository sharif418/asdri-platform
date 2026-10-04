"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartHandshake,
  Languages,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LogoLockup } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CommandPalette, SearchTrigger } from "@/components/search/command-palette";
import { useLanguage } from "@/components/providers/language-provider";
import { navigation, siteConfig } from "@/content/site";
import { langPath } from "@/lib/locale";
import type { DictionaryKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface NavSection {
  key: DictionaryKey;
  href: string;
  children: { key: DictionaryKey; href: string }[];
}

const navSections: NavSection[] = [
  { key: "nav.about", href: "/about", children: [...navigation.about] },
  { key: "nav.academics", href: "/academics", children: [...navigation.academics] },
  { key: "nav.admissions", href: "/admissions", children: [...navigation.admissions] },
  { key: "nav.research", href: "/research", children: [...navigation.research] },
  { key: "nav.media", href: "/media", children: [...navigation.media] },
  { key: "nav.notices", href: "/notices", children: [...navigation.notices] },
  { key: "nav.contact", href: "/contact", children: [...navigation.contact] },
];

/** Internal pathnames are locale-prefixed (/bn/x, /en/x) — strip to compare. */
function displayPath(pathname: string): string {
  if (pathname.startsWith("/en")) return pathname.slice(3) || "/";
  if (pathname.startsWith("/bn")) return pathname.slice(3) || "/";
  return pathname;
}

function TopUtilityBar() {
  const { lang, t, toggle } = useLanguage();
  return (
    <div className="bg-emerald-deep text-ivory/90">
      <div className="container-site flex h-10 items-center justify-between gap-4 text-[12px] sm:text-[13px]">
        <div className="flex min-w-0 items-center gap-4">
          <a
            href={siteConfig.phoneHref}
            className="hidden items-center gap-1.5 transition-colors hover:text-gold sm:inline-flex"
          >
            <Phone aria-hidden className="h-3.5 w-3.5 text-gold" />
            <span dir="ltr">{lang === "bn" ? "০৯টা–৫টা | +৮৮০ ১৮০৫-৪৩৭৯১০" : "9AM–5PM | +880 1805-437910"}</span>
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="hidden items-center gap-1.5 transition-colors hover:text-gold md:inline-flex"
          >
            <Mail aria-hidden className="h-3.5 w-3.5 text-gold" />
            <span className="truncate">{siteConfig.email}</span>
          </a>
          <span className="inline-flex items-center gap-1.5 sm:hidden">
            <MapPin aria-hidden className="h-3.5 w-3.5 text-gold" />
            <span className="truncate">{lang === "bn" ? "সাঁতারকুল, বাড্ডা, ঢাকা" : "Satarkul, Badda, Dhaka"}</span>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-1 rounded-full border border-ivory/25 px-2.5 py-0.5 font-medium tracking-wide transition-colors hover:border-gold hover:text-gold"
            aria-label={lang === "bn" ? "Switch to English" : "বাংলায় দেখুন"}
          >
            <Languages aria-hidden className="h-3.5 w-3.5" />
            <span className={cn("text-[11px]", lang === "bn" ? "opacity-60" : "font-bold text-gold")}>EN</span>
            <span aria-hidden className="opacity-40">|</span>
            <span className={cn("text-[11px]", lang === "en" ? "opacity-60" : "font-bold text-gold")}>বাং</span>
          </button>
          <span aria-hidden className="hidden h-4 w-px bg-ivory/20 sm:block" />
          <Link
            href={langPath(lang, "/login")}
            className="hidden items-center gap-1 transition-colors hover:text-gold sm:inline-flex"
          >
            <LogIn aria-hidden className="h-3.5 w-3.5" />
            {t("action.login")}
          </Link>
          <Link
            href={langPath(lang, "/register")}
            className="hidden items-center gap-1 transition-colors hover:text-gold sm:inline-flex"
          >
            <UserPlus aria-hidden className="h-3.5 w-3.5" />
            {t("action.register")}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Persistent gold rule under the active desktop nav item. */
function ActiveNavUnderline() {
  return (
    <span
      aria-hidden
      className="bg-gold-gradient pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full"
    />
  );
}

/** Desktop mega-menu trigger + panel. */
function DesktopNavItem({ section }: { section: NavSection }) {
  const { t, lang } = useLanguage();
  const pathname = displayPath(usePathname());
  const base = section.href;
  const active = pathname === base || pathname.startsWith(`${base}/`);

  return (
    <NavigationMenuItem>
      <div className="relative">
        <NavigationMenuLink
          asChild
          className={cn(navigationMenuTriggerStyle(), "bg-transparent px-3 py-2 text-[14px] font-medium")}
          data-active={active}
        >
          <Link href={langPath(lang, base)}>
            <span className={cn(active ? "text-primary font-semibold" : "link-sweep")}>{t(section.key)}</span>
          </Link>
        </NavigationMenuLink>
        {active ? <ActiveNavUnderline /> : null}
        {section.children.length > 0 ? (
          <>
            <NavigationMenuTrigger
              className="absolute left-0 top-0 h-full w-full bg-transparent p-0 opacity-0 [&>svg]:hidden"
              aria-hidden
              tabIndex={-1}
            >
              <span className="sr-only">{t(section.key)} menu</span>
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[260px] gap-1 p-2">
                {section.children.map((child) => (
                  <li key={child.href}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={langPath(lang, child.href)}
                        className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary hover:text-primary"
                      >
                        {t(child.key)}
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </>
        ) : null}
      </div>
    </NavigationMenuItem>
  );
}

/** Mobile drawer navigation with accordions (includes its own trigger). */
function MobileNav({ onSearchClick }: { onSearchClick: () => void }) {
  const { t, lang, toggle } = useLanguage();
  const pathname = displayPath(usePathname());
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="মেনু খুলুন"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border text-foreground transition-colors hover:bg-secondary lg:hidden"
        >
          <Menu aria-hidden className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-[320px] flex-col gap-0 overflow-y-auto p-0 sm:w-[360px]"
      >
        <div className="border-b bg-emerald-deep px-5 py-4">
          <SheetTitle className="text-left">
            <LogoLockup
              nameBn={siteConfig.nameBn}
              nameEn={siteConfig.nameEn}
              parentBn={siteConfig.parentBn}
              tone="on-dark"
            />
          </SheetTitle>
        </div>
        <nav aria-label="মোবাইল নেভিগেশন" className="flex-1 px-4 py-4">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSearchClick();
            }}
            className="mb-3 flex w-full items-center gap-2.5 rounded-lg border border-gold/40 bg-gold-soft/30 px-3.5 py-2.5 text-[14px] font-medium text-foreground transition-colors hover:border-gold"
          >
            <Search aria-hidden className="h-4 w-4 text-primary" />
            {t("search.placeholder")}
          </button>
          <Link
            href={langPath(lang, "/")}
            onClick={() => setOpen(false)}
            className={cn(
              "block rounded-md px-3 py-2.5 text-[15px] font-medium hover:bg-secondary",
              pathname === "/" && "bg-secondary text-primary",
            )}
          >
            {t("nav.home")}
          </Link>
          <Accordion type="multiple" className="mt-1">
            {navSections.map((section) => {
              const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
              return (
                <AccordionItem key={section.key} value={section.key} className="border-b-0">
                  <div className="flex items-center justify-between">
                    <Link
                      href={langPath(lang, section.href)}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex-1 py-2.5 text-[15px] font-medium hover:text-primary",
                        active && "text-primary",
                      )}
                    >
                      {t(section.key)}
                    </Link>
                    {section.children.length > 0 ? (
                      <AccordionTrigger className="w-9 justify-end py-2.5 pr-1 [&>svg]:h-4 [&>svg]:w-4" />
                    ) : null}
                  </div>
                  {section.children.length > 0 ? (
                    <AccordionContent className="pb-2">
                      <div className="grid gap-0.5 border-l-2 border-gold/40 pl-3">
                        {section.children.map((child) => (
                          <Link
                            key={child.href}
                            href={langPath(lang, child.href)}
                            onClick={() => setOpen(false)}
                            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-primary"
                          >
                            {t(child.key)}
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  ) : null}
                </AccordionItem>
              );
            })}
          </Accordion>

          <div className="mt-6 grid gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href={langPath(lang, "/login")} onClick={() => setOpen(false)}>
                <LogIn aria-hidden className="h-4 w-4" />
                {t("action.login")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={langPath(lang, "/register")} onClick={() => setOpen(false)}>
                <UserPlus aria-hidden className="h-4 w-4" />
                {t("action.register")}
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-muted-foreground"
              onClick={() => {
                toggle();
                setOpen(false);
              }}
            >
              <Languages aria-hidden className="h-4 w-4" />
              {lang === "bn" ? "Switch to English" : "বাংলায় দেখুন"}
            </Button>
          </div>
        </nav>
        <div className="border-t bg-parchment px-5 py-4 text-xs text-muted-foreground dark:bg-secondary/40">
          <p className="flex items-center gap-1.5">
            <Phone aria-hidden className="h-3.5 w-3.5 text-gold" />
            <span dir="ltr">{siteConfig.phone}</span>
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
/** Sticky site header: utility bar + logo + mega menu + search + donate CTA. */
export function SiteHeader() {
  const { t, lang } = useLanguage();
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
    <header className="sticky top-0 z-50 w-full">
      <TopUtilityBar />
      <div
        className={cn(
          "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 transition-shadow",
          scrolled ? "border-border shadow-md shadow-emerald-950/5" : "border-transparent",
        )}
      >
        <div className="container-site flex h-16 items-center justify-between gap-4 lg:h-[72px]">
          <Link href={langPath(lang, "/")} aria-label={siteConfig.nameEn} className="min-w-0">
            <LogoLockup nameBn={siteConfig.nameBn} nameEn={siteConfig.nameEn} parentBn={siteConfig.parentBn} />
          </Link>

          <nav aria-label="প্রধান নেভিগেশন" className="hidden lg:block">
            <NavigationMenu>
              <NavigationMenuList className="gap-0.5">
                <NavigationMenuItem>
                  <div className="relative">
                    <NavigationMenuLink
                      asChild
                      className={cn(navigationMenuTriggerStyle(), "bg-transparent px-3 py-2 text-[14px] font-medium")}
                    >
                      <Link href={langPath(lang, "/")}>
                        <span className={cn(pathname === "/" ? "text-primary font-semibold" : "link-sweep")}>
                          {t("nav.home")}
                        </span>
                      </Link>
                    </NavigationMenuLink>
                    {pathname === "/" ? <ActiveNavUnderline /> : null}
                  </div>
                </NavigationMenuItem>
                {navSections.map((section) => (
                  <DesktopNavItem key={section.key} section={section} />
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          <div className="flex items-center gap-2.5">
            <SearchTrigger onClick={() => setSearchOpen(true)} className="hidden lg:inline-flex" />
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
            <MobileNav onSearchClick={() => setSearchOpen(true)} />
          </div>
        </div>
      </div>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
