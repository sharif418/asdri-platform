import type { ReactNode } from "react";
import { getSiteConfig } from "@/lib/content/site";
import { getSiteMenus, type MenuLinkView, type SiteMenusView } from "@/lib/content/menus";
import { getEnabledFlags } from "@/lib/settings";
import { SiteConfigProvider } from "@/components/providers/site-config-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ScrollToTop } from "@/components/shared/scroll-to-top";

/**
 * Shell layout for every public page: sticky header on top,
 * content in the middle, footer pinned to the bottom (min-h-screen flex).
 * The DB-backed site config, feature flags and navigation menus are fetched
 * once and shared through context (client chrome renders DB values; flags
 * hide modules — and their menu items — the institute has switched off).
 */

/** Drop links whose bound flag is disabled (missing keys stay visible). */
function filterByFlags<T extends MenuLinkView>(links: T[], flags: Record<string, boolean>): T[] {
  return links.filter((link) => !link.flagKey || (flags[link.flagKey] ?? true));
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [siteConfig, flagMap, rawMenus] = await Promise.all([getSiteConfig(), getEnabledFlags(), getSiteMenus()]);
  const flags = Object.fromEntries(flagMap);

  const menus: SiteMenusView | null = rawMenus
    ? {
        main: rawMenus.main
          .map((section) => ({ ...section, children: filterByFlags(section.children, flags) }))
          .filter((section) => !section.flagKey || (flags[section.flagKey] ?? true)),
        utility: filterByFlags(rawMenus.utility, flags),
        footerPrimary: filterByFlags(rawMenus.footerPrimary, flags),
        footerSecondary: filterByFlags(rawMenus.footerSecondary, flags),
      }
    : null;

  return (
    <SiteConfigProvider config={siteConfig} flags={flags} menu={menus}>
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <ScrollToTop />
      </div>
    </SiteConfigProvider>
  );
}
