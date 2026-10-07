import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, ChevronRight, Home } from "lucide-react";
import type { LocalizedText } from "@/types";
import { pick } from "@/types";
import type { Language } from "@/types";
import { langPath } from "@/lib/locale";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";

export interface PageHeroMeta {
  /** Full badge text per language, e.g. "মোট ১০ টি নোটিশ" / "10 notices". */
  textBn: string;
  textEn: string;
}

export interface PageHeroProps {
  eyebrow: LocalizedText | string;
  title: LocalizedText | string;
  description?: LocalizedText | string;
  lang: Language;
  breadcrumb: { label: LocalizedText | string; href?: string }[];
  arabicEcho?: string;
  /** Explicit section key for the calligraphic piece (defaults to the first breadcrumb's href). */
  section?: string;
  /** Optional live meta pill rendered after the description (e.g. content counts). */
  meta?: PageHeroMeta;
  /** Optional slot rendered after the heading block — stays inside the max-w-3xl column. */
  children?: ReactNode;
  className?: string;
}

/**
 * The calligraphic piece of each section — one short word, set large in
 * Amiri, cropped by the band's edge the way the great Islamic collections
 * let a single word carry a wall. Derived per section so every inner page
 * of the site shares one system; the word is ornament, never information.
 */
const SECTION_CALLIGRAPHY: Record<string, string> = {
  "/about": "الدَّعْوَة",
  "/academics": "الْعِلْم",
  "/admissions": "الْبِدَايَة",
  "/research": "الْبَحْث",
  "/media": "الْبَلَاغ",
  "/notices": "الْإِعْلَان",
  "/support": "الْإِحْسَان",
  "/contact": "التَّوَاصُل",
};

function calligraphyFor(breadcrumb: PageHeroProps["breadcrumb"], section?: string): string | null {
  if (section) return SECTION_CALLIGRAPHY[section] ?? null;
  const first = breadcrumb[0]?.href;
  if (!first) return null;
  const clean = first.replace(/^\/(bn|en)/, "").replace(/\/$/, "") || "/";
  return SECTION_CALLIGRAPHY[clean] ?? null;
}

/**
 * The inner-page band — the signature surface of the site.
 *
 * Deep emerald ground built from layered light (a radial lift behind the
 * title, a vignette at the edges), a fine lattice at lower opacity, and an
 * inset gold hairline frame with corner emphasis: the illuminated-manuscript
 * border, drawn in CSS, costing nothing to load. The section's calligraphic
 * word sits at the right edge, cropped like a folio margin; the verse is
 * typeset in gold above the title with a small ornament. On phones the word
 * recedes behind the text and legibility wins.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  lang,
  breadcrumb,
  arabicEcho,
  section,
  meta,
  children,
  className,
}: PageHeroProps) {
  const resolve = (text: LocalizedText | string) => (typeof text === "string" ? text : pick(text, lang));
  const calligraphy = calligraphyFor(breadcrumb, section);

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-emerald-deep text-ivory",
        className,
      )}
    >
      {/* Ground: layered light over the emerald */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_140%_at_18%_0%,rgba(20,84,58,0.9)_0%,rgba(15,81,50,0)_55%)]"
      />
      <div aria-hidden className="pattern-lattice-light absolute inset-0 opacity-70" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45"
      />

      {/* The illuminated frame: an inset hairline with corner emphasis */}
      <div aria-hidden className="pointer-events-none absolute inset-2.5 rounded-sm border border-gold/15 sm:inset-3" />
      <div aria-hidden className="pointer-events-none absolute inset-2.5 sm:inset-3">
        <span className="absolute -left-px -top-px h-4 w-4 border-l-2 border-t-2 border-gold/45" />
        <span className="absolute -right-px -top-px h-4 w-4 border-r-2 border-t-2 border-gold/45" />
        <span className="absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 border-gold/45" />
        <span className="absolute -bottom-px -right-px h-4 w-4 border-b-2 border-r-2 border-gold/45" />
      </div>

      {/* The section's calligraphic word, cropped at the folio's edge */}
      {calligraphy ? (
        <p
          aria-hidden
          dir="rtl"
          className="font-arabic pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 select-none text-[110px] leading-none text-gold/[0.13] sm:block sm:text-[150px] lg:text-[190px] print:hidden"
        >
          {calligraphy}
        </p>
      ) : null}
      {calligraphy ? (
        <p
          aria-hidden
          dir="rtl"
          className="font-arabic pointer-events-none absolute -right-2 top-3 select-none text-[64px] leading-none text-gold/[0.08] sm:hidden print:hidden"
        >
          {calligraphy}
        </p>
      ) : null}

      <div className="container-site relative py-14 sm:py-20">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ivory/70">
            <li>
              <Link href={langPath(lang, "/")} className="inline-flex items-center gap-1 transition-colors hover:text-gold">
                <Home className="h-3.5 w-3.5" />
                <span>{lang === "bn" ? "হোম" : "Home"}</span>
              </Link>
            </li>
            {breadcrumb.map((crumb, index) => {
              const isLast = index === breadcrumb.length - 1;
              return (
                <li key={`${resolve(crumb.label)}-${index}`} className="flex items-center gap-1.5">
                  <ChevronRight aria-hidden className="h-3.5 w-3.5 text-gold/70" />
                  {crumb.href && !isLast ? (
                    <Link href={crumb.href} className="transition-colors hover:text-gold">
                      {resolve(crumb.label)}
                    </Link>
                  ) : (
                    <span className={cn(isLast && "font-medium text-ivory")} aria-current={isLast ? "page" : undefined}>
                      {resolve(crumb.label)}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-8 max-w-3xl">
          {arabicEcho ? (
            <p dir="rtl" lang="ar" className="font-arabic mb-5 flex items-center gap-3 text-xl text-gold/90 sm:text-2xl">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rotate-45 bg-gold/70" />
              <span>{arabicEcho}</span>
              <span aria-hidden className="inline-block h-1.5 w-1.5 rotate-45 bg-gold/70" />
            </p>
          ) : null}
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
            lang={lang}
            align="left"
            tone="on-dark"
            as="h1"
          />
          {meta ? (
            <div className="mt-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-gold">
                <Bell aria-hidden className="h-3.5 w-3.5" />
                {lang === "bn" ? meta.textBn : meta.textEn}
              </span>
            </div>
          ) : null}
          {children ? <div className="mt-6">{children}</div> : null}
        </div>
      </div>

      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-gold-gradient" />
    </section>
  );
}
