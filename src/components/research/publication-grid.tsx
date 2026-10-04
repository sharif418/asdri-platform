"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookMarked } from "lucide-react";
import { PublicationCover } from "@/components/research/publication-cover";
import { toBnDigits } from "@/lib/format";
import { langPath } from "@/lib/locale";
import { pick } from "@/types";
import type { Language, PublicationItem } from "@/types";

type FilterValue = "all" | PublicationItem["type"];

const filterOptions: { value: FilterValue; labelBn: string; labelEn: string }[] = [
  { value: "all", labelBn: "সকল", labelEn: "All" },
  { value: "journal", labelBn: "জার্নাল", labelEn: "Journals" },
  { value: "book", labelBn: "গ্রন্থ", labelEn: "Books" },
  { value: "paper", labelBn: "রিসার্চ পেপার", labelEn: "Papers" },
];

/**
 * Filterable grid of faculty publications with CSS-designed covers.
 */
export function PublicationGrid({ items, lang }: { items: PublicationItem[]; lang: Language }) {
  const [filter, setFilter] = useState<FilterValue>("all");

  const visible = filter === "all" ? items : items.filter((item) => item.type === filter);
  const countFor = (value: FilterValue) =>
    value === "all" ? items.length : items.filter((item) => item.type === value).length;

  return (
    <div>
      {/* filter tabs */}
      <div
        role="group"
        aria-label={lang === "bn" ? "প্রকাশনার ধরন অনুযায়ী ফিল্টার" : "Filter publications by type"}
        className="flex flex-wrap justify-center gap-2"
      >
        {filterOptions.map((option) => {
          const active = filter === option.value;
          const count = countFor(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "border border-border bg-card text-muted-foreground hover:-translate-y-0.5 hover:border-gold/50 hover:text-foreground"
              }`}
            >
              {lang === "bn" ? option.labelBn : option.labelEn}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? "bg-primary-foreground/20" : "bg-muted"
                }`}
              >
                {lang === "bn" ? toBnDigits(count) : String(count)}
              </span>
            </button>
          );
        })}
      </div>

      {/* grid */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <article
            key={item.id}
            className="group flex h-full flex-col rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg"
          >
            <PublicationCover item={item} lang={lang} />
            <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-4">
              <h3 className="font-heading text-[15px] font-semibold leading-snug">{pick(item.title, lang)}</h3>
              <p className="mt-1.5 text-[12.5px] font-medium text-primary">{item.author}</p>
              <p className="text-[11.5px] text-muted-foreground">{pick(item.authorRole, lang)}</p>
              <p className="mt-2.5 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                {pick(item.description, lang)}
              </p>
              {item.issnIsbn ? (
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {item.issnIsbn}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground" aria-live="polite">
        {lang === "bn"
          ? `${toBnDigits(visible.length)} টি প্রকাশনা দেখানো হচ্ছে`
          : `Showing ${visible.length} publications`}
      </p>

      <div className="mt-6 text-center">
        <Link
          href={langPath(lang, "/research/library")}
          className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-6 py-2.5 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
        >
          <BookMarked aria-hidden className="h-4 w-4" />
          {lang === "bn" ? "সাইটেশনের জন্য লাইব্রেরিতে যান" : "Visit the Library for Citations"}
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
