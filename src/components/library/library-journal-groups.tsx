import Link from "next/link";
import { LibraryBig, Layers } from "lucide-react";
import { formatNumber, toBnDigits } from "@/lib/format";
import { pick, type Language } from "@/types";
import type { LibraryJournalGroup } from "@/lib/content/library";
import {
  buildLibraryUrl,
  libraryItemHref,
} from "@/components/library/library-shared";

/**
 * The journals shelf — issues grouped by journalKey. Each journal's name
 * links to its pre-filtered catalogue view (?journal=key); each issue chip
 * (volume/issue/year) opens that issue's record page.
 */
export function LibraryJournalGroups({
  groups,
  lang,
}: {
  groups: LibraryJournalGroup[];
  lang: Language;
}) {
  const bn = lang === "bn";
  if (groups.length === 0) return null;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {groups.map((group) => (
        <article
          key={group.key}
          className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-gold/40"
        >
          <div
            aria-hidden
            className="pattern-lattice-light pointer-events-none absolute inset-0 opacity-40"
          />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
                  {bn ? "জার্নাল / পত্রিকা" : "Journal / Periodical"}
                </p>
                <h3 className="font-heading mt-1 text-base font-semibold leading-snug">
                  <Link
                    href={buildLibraryUrl(lang, { journalKey: group.key })}
                    className="transition-colors hover:text-primary dark:hover:text-gold"
                  >
                    {pick(group.name, lang)}
                  </Link>
                </h3>
              </div>
              <LibraryBig
                aria-hidden
                className="h-5 w-5 shrink-0 text-gold/70"
              />
            </div>

            <p className="mt-2 text-[12.5px] text-muted-foreground">
              {bn
                ? `${formatNumber(group.issueCount, lang)}টি সংখ্যা${group.latestYear != null ? ` · সর্বশেষ ${formatNumber(group.latestYear, lang)}` : ""}`
                : `${group.issueCount} issue${group.issueCount === 1 ? "" : "s"}${group.latestYear != null ? ` · latest ${group.latestYear}` : ""}`}
            </p>

            <ul className="mt-4 flex flex-wrap gap-2">
              {group.issues.map((issue) => {
                const label = [
                  issue.issueLabel || pick(issue.title, lang),
                  issue.volume ? `${bn ? "খণ্ড" : "vol."} ${issue.volume}` : "",
                  issue.year != null
                    ? bn
                      ? toBnDigits(issue.year)
                      : String(issue.year)
                    : "",
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={issue.slug}>
                    <Link
                      href={libraryItemHref(lang, issue.slug)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-gold hover:text-gold-foreground hover:shadow-sm"
                    >
                      <Layers aria-hidden className="h-3 w-3 text-gold" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <Link
              href={buildLibraryUrl(lang, { journalKey: group.key })}
              className="link-sweep mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-primary dark:text-gold"
            >
              {bn ? "সব সংখ্যা দেখুন" : "View all issues"}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
