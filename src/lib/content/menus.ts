import { db } from "@/lib/db";

/**
 * Navigation menus from the MenuItem tree (the office edits them in
 * /admin/settings/menus). Reading is layout-side: one query per render cycle
 * with a short TTL cache; writes go through /api/admin/menus which calls
 * invalidateSiteMenus().
 *
 * Returns null when no menu rows exist so the header/footer fall back to the
 * static seed navigation (a fresh install with an empty MenuItem table).
 */

export interface MenuLinkView {
  labelBn: string;
  labelEn: string;
  href: string;
  flagKey?: string | null;
}

export interface MenuSectionView extends MenuLinkView {
  children: MenuLinkView[];
}

export interface SiteMenusView {
  main: MenuSectionView[];
  utility: MenuLinkView[];
  footerPrimary: MenuLinkView[];
  footerSecondary: MenuLinkView[];
}

let cached: { value: SiteMenusView | null; expiresAt: number } | null = null;
const TTL_MS = 30_000;

export function invalidateSiteMenus(): void {
  cached = null;
}

/** Build the header/footer view from the MenuItem tree (one level of nesting). */
export async function getSiteMenus(): Promise<SiteMenusView | null> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const rows = await db.menuItem.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      location: true,
      labelBn: true,
      labelEn: true,
      href: true,
      parentId: true,
      sortOrder: true,
      isVisible: true,
      flagKey: true,
    },
  });

  if (rows.length === 0) {
    cached = { value: null, expiresAt: Date.now() + TTL_MS };
    return null;
  }

  const visible = rows.filter((row) => row.isVisible);
  const toLink = (row: (typeof rows)[number]): MenuLinkView => ({
    labelBn: row.labelBn,
    labelEn: row.labelEn || row.labelBn,
    href: row.href,
    flagKey: row.flagKey ?? null,
  });

  const byLocation = (location: string) => visible.filter((row) => row.location === location);
  const parents = byLocation("HEADER_MAIN").filter((row) => !row.parentId);

  const value: SiteMenusView = {
    main: parents.map((parent) => ({
      ...toLink(parent),
      children: byLocation("HEADER_MAIN")
        .filter((row) => row.parentId === parent.id)
        .map(toLink),
    })),
    utility: byLocation("HEADER_UTILITY").map(toLink),
    footerPrimary: byLocation("FOOTER_PRIMARY").map(toLink),
    footerSecondary: byLocation("FOOTER_SECONDARY").map(toLink),
  };

  cached = { value, expiresAt: Date.now() + TTL_MS };
  return value;
}
