"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteConfigView } from "@/lib/content/site";

/**
 * Client context for the DB-backed site config + feature flags. The (site)
 * layout (server) awaits them once and provides them here so client chrome
 * (header, footer, hero) renders DB values and hides disabled modules
 * without fetching.
 */

interface SiteConfigContextValue {
  config: SiteConfigView;
  flags: Record<string, boolean>;
}

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

export function SiteConfigProvider({
  config,
  flags,
  children,
}: {
  config: SiteConfigView;
  flags: Record<string, boolean>;
  children: ReactNode;
}) {
  return <SiteConfigContext.Provider value={{ config, flags }}>{children}</SiteConfigContext.Provider>;
}

/** The site config injected by the layout; throws when used outside it. */
export function useSiteConfig(): SiteConfigView {
  const value = useContext(SiteConfigContext);
  if (!value) {
    throw new Error("useSiteConfig must be used inside <SiteConfigProvider>");
  }
  return value.config;
}

/** Feature flags injected by the layout (missing keys = enabled). */
export function useFeatureFlags(): Record<string, boolean> {
  const value = useContext(SiteConfigContext);
  if (!value) throw new Error("useFeatureFlags must be used inside <SiteConfigProvider>");
  return value.flags;
}

/** Convenience: is a module enabled in this render? */
export function useModuleEnabled(key: string): boolean {
  return useFeatureFlags()[key] ?? true;
}
