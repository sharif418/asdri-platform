/**
 * Locale primitives — shared by server components, the proxy and tests.
 * Bangla is the default language and lives at the bare path; English lives
 * under /en. The URL is the single source of truth (no cookies).
 */

export const LANGS = ["bn", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "bn";

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/** Public path for a localized route: bn → /path, en → /en/path. */
export function langPath(lang: Lang, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (lang === "en") return clean === "/" ? "/en" : `/en${clean}`;
  return clean;
}

/** Opposite language (for the switcher). */
export function otherLang(lang: Lang): Lang {
  return lang === "bn" ? "en" : "bn";
}

/**
 * hreflang alternates for a canonical (bn-style) path.
 * bn → canonical URL, en → /en URL, x-default → bn.
 */
export function alternatesFor(path: string, siteUrl: string): {
  languages: Record<string, string>;
  canonical: string;
} {
  const clean = path === "/" ? "" : path;
  return {
    canonical: `${siteUrl}${clean || "/"}`,
    languages: {
      bn: `${siteUrl}${clean || "/"}`,
      en: `${siteUrl}/en${clean}`,
      "x-default": `${siteUrl}${clean || "/"}`,
    },
  };
}

/** html lang + dir for a locale. */
export function htmlLangAttrs(lang: Lang): { lang: string; dir: "ltr" } {
  return { lang: lang === "bn" ? "bn" : "en", dir: "ltr" as const };
}

/**
 * Map an internal pathname (/bn/x or /en/x — what usePathname reports after
 * the proxy rewrite) back to the public display path (/x). Used for active
 * nav states and the language switcher.
 */
export function displayPath(pathname: string): string {
  if (pathname.startsWith("/en")) return pathname.slice(3) || "/";
  if (pathname.startsWith("/bn")) return pathname.slice(3) || "/";
  return pathname;
}
