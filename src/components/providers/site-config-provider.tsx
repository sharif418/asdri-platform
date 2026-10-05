"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteConfigView } from "@/lib/content/site";
import type { SiteMenusView } from "@/lib/content/menus";

/**
 * Client context for the DB-backed site config + feature flags + navigation
 * menus. The (site) layout (server) awaits them once and provides them here
 * so client chrome (header, footer, hero) renders DB values and hides
 * disabled modules without fetching.
 */

interface SiteConfigContextValue {
  config: SiteConfigView;
  flags: Record<string, boolean>;
  /** DB navigation menus (already flag-filtered); null = static fallback. */
  menu: SiteMenusView | null;
}

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

export function SiteConfigProvider({
  config,
  flags,
  menu = null,
  children,
}: {
  config: SiteConfigView;
  flags: Record<string, boolean>;
  menu?: SiteMenusView | null;
  children: ReactNode;
}) {
  return <SiteConfigContext.Provider value={{ config, flags, menu }}>{children}</SiteConfigContext.Provider>;
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

/** DB navigation menus (flag-filtered) — null falls back to static nav. */
export function useSiteMenu(): SiteMenusView | null {
  const value = useContext(SiteConfigContext);
  if (!value) throw new Error("useSiteMenu must be used inside <SiteConfigProvider>");
  return value.menu;
}

/** Convenience: is a module enabled in this render? */
export function useModuleEnabled(key: string): boolean {
  return useFeatureFlags()[key] ?? true;
}
