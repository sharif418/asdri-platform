import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toBnDigits } from "@/lib/format";
import { pick, type Language } from "@/types";
import type { LibraryCategoryNode } from "@/lib/content/library";
import {
  LIBRARY_LANGUAGE_LABELS,
  LIBRARY_TYPE_FILTERS,
  buildLibraryUrl,
} from "@/components/library/library-shared";

/** The catalogue's applied filter state (all optional, all removable). */
export interface LibraryFilterValues {
  q: string;
  type: string;
  category: string;
  year: string;
  language: string;
  journalKey: string;
}

interface LibraryFiltersProps {
  lang: Language;
  values: LibraryFilterValues;
  categories: LibraryCategoryNode[];
  years: number[];
  languages: { code: string; count: number }[];
}

const selectClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-gold/60 focus:ring-2 focus:ring-gold/30";

/** One removable applied-filter chip (link-based — no JS needed to clear). */
function FilterChip({
  label,
  removeHref,
  lang,
}: {
  label: string;
  removeHref: string;
  lang: Language;
}) {
  return (
    <Link
      href={removeHref}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 py-1 pl-3 pr-2 text-[12.5px] font-medium text-foreground transition-colors hover:border-gold hover:bg-gold/20"
    >
      <span className="truncate">{label}</span>
      <X
        aria-hidden
        className="h-3.5 w-3.5 shrink-0 text-gold-foreground/70 group-hover:text-gold-foreground"
      />
      <span className="sr-only">
        {lang === "bn" ? "ফিল্টার সরান" : "Remove filter"}
      </span>
    </Link>
  );
}

/**
 * The catalogue's search + filter row — one plain GET form (works without
 * JavaScript, which is how most of the audience reaches it on a phone):
 * keyword box, type/category/year/language selects, one submit. Applied
 * filters render again underneath as removable link chips.
 */
export function LibraryFilters({
  lang,
  values,
  categories,
  years,
  languages,
}: LibraryFiltersProps) {
  const bn = lang === "bn";

  const chips: { label: string; removeHref: string }[] = [];
  if (values.q.trim()) {
    chips.push({
      label: `“${values.q.trim()}”`,
      removeHref: buildLibraryUrl(lang, { ...values, q: "", page: 1 }),
    });
  }
  if (values.type) {
    const typeLabel = LIBRARY_TYPE_FILTERS.find(
      (entry) => entry.value === values.type,
    );
    chips.push({
      label: typeLabel ? pick(typeLabel.label, lang) : values.type,
      removeHref: buildLibraryUrl(lang, { ...values, type: "", page: 1 }),
    });
  }
  if (values.category) {
    const findNode = (nodes: LibraryCategoryNode[]): string => {
      for (const node of nodes) {
        if (node.slug === values.category) return pick(node.name, lang);
        const child = findNode(node.children);
        if (child) return child;
      }
      return "";
    };
    const label = findNode(categories) || values.category;
    chips.push({
      label,
      removeHref: buildLibraryUrl(lang, { ...values, category: "", page: 1 }),
    });
  }
  if (values.year) {
    chips.push({
      label: bn ? `${toBnDigits(values.year)} সাল` : `Year ${values.year}`,
      removeHref: buildLibraryUrl(lang, { ...values, year: "", page: 1 }),
    });
  }
  if (values.language) {
    chips.push({
      label: pick(
        LIBRARY_LANGUAGE_LABELS[values.language] ?? {
          bn: values.language,
          en: values.language,
        },
        lang,
      ),
      removeHref: buildLibraryUrl(lang, { ...values, language: "", page: 1 }),
    });
  }
  if (values.journalKey) {
    chips.push({
      label: values.journalKey,
      removeHref: buildLibraryUrl(lang, { ...values, journalKey: "", page: 1 }),
    });
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-card p-4 shadow-sm sm:p-5">
      <form
        action={buildLibraryUrl(lang, {})}
        method="get"
        role="search"
        aria-label={bn ? "লাইব্রেরি অনুসন্ধান" : "Search the library"}
        className="space-y-3"
      >
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              name="q"
              defaultValue={values.q}
              maxLength={120}
              placeholder={
                bn
                  ? "শিরোনাম, লেখক বা বিষয় লিখে খুঁজুন…"
                  : "Search by title, author, or subject…"
              }
              aria-label={bn ? "অনুসন্ধান শব্দ" : "Search terms"}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-gold/60 focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <Button type="submit" className="gap-1.5 font-semibold">
            <Search aria-hidden className="h-4 w-4" />
            {bn ? "খুঁজুন" : "Search"}
          </Button>
        </div>

        {/* filter selects — the form carries them on the same submit */}
        <fieldset className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <legend className="sr-only">{bn ? "ফিল্টার" : "Filters"}</legend>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {bn ? "ধরন" : "Type"}
            </span>
            <select
              name="type"
              defaultValue={values.type}
              className={selectClass}
            >
              {LIBRARY_TYPE_FILTERS.map((entry) => (
                <option key={entry.value || "all"} value={entry.value}>
                  {pick(entry.label, lang)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {bn ? "ক্যাটাগরি" : "Category"}
            </span>
            <select
              name="category"
              defaultValue={values.category}
              className={selectClass}
            >
              <option value="">{bn ? "সব ক্যাটাগরি" : "All categories"}</option>
              {categories.map((node) => (
                <option key={node.slug} value={node.slug}>
                  {pick(node.name, lang)} (
                  {bn ? toBnDigits(node.count) : node.count})
                </option>
              ))}
              {categories.flatMap((node) =>
                node.children.map((child) => (
                  <option key={child.slug} value={child.slug}>
                    {"— "}
                    {pick(child.name, lang)} (
                    {bn ? toBnDigits(child.count) : child.count})
                  </option>
                )),
              )}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {bn ? "প্রকাশকাল" : "Year"}
            </span>
            <select
              name="year"
              defaultValue={values.year}
              className={selectClass}
            >
              <option value="">{bn ? "সব সাল" : "All years"}</option>
              {years.map((year) => (
                <option key={year} value={String(year)}>
                  {bn ? toBnDigits(year) : year}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {bn ? "ভাষা" : "Language"}
            </span>
            <select
              name="language"
              defaultValue={values.language}
              className={selectClass}
            >
              <option value="">{bn ? "সব ভাষা" : "All languages"}</option>
              {languages.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {pick(
                    LIBRARY_LANGUAGE_LABELS[entry.code] ?? {
                      bn: entry.code,
                      en: entry.code,
                    },
                    lang,
                  )}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
        <input type="hidden" name="journal" value={values.journalKey} />
        {values.journalKey ? (
          <p className="text-[12px] text-muted-foreground">
            {bn ? "জার্নাল ফিল্টার সক্রিয় — " : "Journal filter active — "}
            <Link
              href={buildLibraryUrl(lang, { ...values, journalKey: "" })}
              className="font-semibold text-primary underline-offset-2 hover:underline dark:text-gold"
            >
              {bn ? "সরান" : "clear it"}
            </Link>
          </p>
        ) : null}
      </form>

      {chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-gold/25 pt-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <SlidersHorizontal aria-hidden className="h-3.5 w-3.5 text-gold" />
            {bn ? "প্রয়োগকৃত ফিল্টার" : "Applied filters"}
          </span>
          {chips.map((chip) => (
            <FilterChip
              key={chip.label}
              label={chip.label}
              removeHref={chip.removeHref}
              lang={lang}
            />
          ))}
          {chips.length > 1 ? (
            <Link
              href={buildLibraryUrl(lang, {})}
              className={cn(
                "rounded-full px-3 py-1 text-[12.5px] font-semibold text-muted-foreground transition-colors",
                "hover:text-primary dark:hover:text-gold",
              )}
            >
              {bn ? "সব মুছুন" : "Clear all"}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
