import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, ChevronRight, Home } from "lucide-react";
import type { LocalizedText } from "@/types";
import { pick } from "@/types";
import type { Language } from "@/types";
import { SectionHeading } from "./section-heading";
import { StarMotif } from "./ornaments";
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
  /** Optional live meta pill rendered after the description (e.g. content counts). */
  meta?: PageHeroMeta;
  /** Optional slot rendered after the heading block — stays inside the max-w-3xl column. */
  children?: ReactNode;
  className?: string;
}

/**
 * Sub-page hero banner: deep emerald ground, lattice pattern, gold rules,
 * breadcrumb trail, and an optional Arabic calligraphic echo.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  lang,
  breadcrumb,
  arabicEcho,
  meta,
  children,
  className,
}: PageHeroProps) {
  const resolve = (text: LocalizedText | string) => (typeof text === "string" ? text : pick(text, lang));

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-emerald-deep text-ivory",
        className,
      )}
    >
      <div aria-hidden className="pattern-lattice-light absolute inset-0" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40"
      />
      <div
        aria-hidden
        className="absolute -top-24 right-0 hidden opacity-[0.07] lg:block"
      >
        <StarMotif className="h-96 w-96 text-gold" />
      </div>

      <div className="container-site relative py-14 sm:py-20">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ivory/70">
            <li>
              <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-gold">
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
            <p dir="rtl" lang="ar" className="font-arabic mb-4 text-xl text-gold/90 sm:text-2xl">
              {arabicEcho}
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
