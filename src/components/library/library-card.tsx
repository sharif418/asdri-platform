import Link from "next/link";
import {
  BookMarked,
  CalendarDays,
  Lock,
  Newspaper,
  FileText,
} from "lucide-react";
import { BrandMonoMark } from "@/components/shared/logo";
import { toBnDigits } from "@/lib/format";
import { pick, type Language } from "@/types";
import type { LibraryCardItem } from "@/lib/content/library";
import {
  LIBRARY_MEMBERS_LABEL,
  LIBRARY_TYPE_LABELS,
  libraryCreatorLine,
  libraryItemHref,
} from "@/components/library/library-shared";
import { cn } from "@/lib/utils";

const TYPE_ICON = {
  BOOK: BookMarked,
  JOURNAL_ISSUE: Newspaper,
  PAPER: FileText,
  DIGITAL_FILE: FileText,
} as const;

/**
 * A catalogue card — cover (or the institute's mono mark on a parchment
 * placeholder), title, subtitle, creators (et al. beyond two), type badge,
 * year, MEMBERS badge and category. The whole card links to the record.
 */
export function LibraryCard({
  item,
  lang,
}: {
  item: LibraryCardItem;
  lang: Language;
}) {
  const bn = lang === "bn";
  const TypeIcon = TYPE_ICON[item.type];
  const creators = libraryCreatorLine(item.creators, lang);
  const journalLabel =
    item.journal && (item.journal.issueLabel || item.journal.volume)
      ? [
          item.journal.issueLabel,
          item.journal.volume
            ? `${bn ? "খণ্ড" : "vol."} ${item.journal.volume}`
            : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <Link
      href={libraryItemHref(lang, item.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
    >
      {/* cover band */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-parchment dark:bg-secondary/40">
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span
              aria-hidden
              className="pattern-lattice-light absolute inset-0 opacity-70"
            />
            <BrandMonoMark
              tone="emerald"
              className="relative h-12 opacity-20 transition-opacity group-hover:opacity-35"
            />
            <TypeIcon
              aria-hidden
              className="relative h-5 w-5 text-primary/50 dark:text-gold/50"
            />
          </span>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
          <TypeIcon aria-hidden className="h-3 w-3" />
          {pick(LIBRARY_TYPE_LABELS[item.type], lang)}
        </span>
        {item.visibility === "MEMBERS" ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-gold/50 bg-ivory px-2.5 py-1 text-[10.5px] font-bold text-gold-foreground shadow-sm">
            <Lock aria-hidden className="h-3 w-3" />
            {pick(LIBRARY_MEMBERS_LABEL, lang)}
          </span>
        ) : null}
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-[15.5px] font-semibold leading-snug transition-colors group-hover:text-primary dark:group-hover:text-gold">
          {pick(item.title, lang)}
        </h3>
        {pick(item.subtitle, lang) ? (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {pick(item.subtitle, lang)}
          </p>
        ) : null}

        {creators ? (
          <p
            className="mt-2 text-[12.5px] font-medium text-foreground/80"
            dir="auto"
          >
            {creators}
          </p>
        ) : null}

        <div className="mt-3 flex flex-1" />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-dashed border-border pt-3 text-[12px] text-muted-foreground">
          {item.year != null ? (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <CalendarDays aria-hidden className="h-3.5 w-3.5 text-gold" />
              {bn ? toBnDigits(item.year) : item.year}
            </span>
          ) : null}
          {journalLabel ? (
            <span className="rounded-full bg-gold/10 px-2 py-0.5 font-semibold text-gold-foreground">
              {journalLabel}
            </span>
          ) : null}
          {item.category ? (
            <span
              className={cn(
                "truncate font-medium",
                !item.year && !journalLabel && "flex-1",
              )}
            >
              {pick(item.category.name, lang)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/** Compact related-item row for the record page's sidebar. */
export function LibraryRelatedRow({
  item,
  lang,
}: {
  item: LibraryCardItem;
  lang: Language;
}) {
  const bn = lang === "bn";
  return (
    <Link
      href={libraryItemHref(lang, item.slug)}
      className="group flex items-start gap-3 rounded-xl border bg-card p-3 transition-all hover:border-gold/50 hover:shadow-sm"
    >
      <span className="relative flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-parchment dark:bg-secondary/40">
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <BrandMonoMark tone="emerald" className="h-7 opacity-25" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold leading-snug group-hover:text-primary dark:group-hover:text-gold">
          {pick(item.title, lang)}
        </span>
        <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
          {pick(LIBRARY_TYPE_LABELS[item.type], lang)}
          {item.year != null
            ? ` · ${bn ? toBnDigits(item.year) : item.year}`
            : ""}
        </span>
      </span>
    </Link>
  );
}
