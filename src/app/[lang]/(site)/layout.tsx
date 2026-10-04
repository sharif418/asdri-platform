import type { ReactNode } from "react";
import { getSiteConfig } from "@/lib/content/site";
import { getEnabledFlags } from "@/lib/settings";
import { SiteConfigProvider } from "@/components/providers/site-config-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ScrollToTop } from "@/components/shared/scroll-to-top";

/**
 * Shell layout for every public page: sticky header on top,
 * content in the middle, footer pinned to the bottom (min-h-screen flex).
 * The DB-backed site config and feature flags are fetched once and shared
 * through context (client chrome renders DB values; flags hide modules
 * the institute has switched off).
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [siteConfig, flagMap] = await Promise.all([getSiteConfig(), getEnabledFlags()]);
  const flags = Object.fromEntries(flagMap);
  return (
    <SiteConfigProvider config={siteConfig} flags={flags}>
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
