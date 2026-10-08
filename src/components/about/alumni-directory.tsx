import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { toBnDigits } from "@/lib/format";
import { pick, type Language } from "@/types";
import { cn } from "@/lib/utils";
import type { AlumniDirectoryResult } from "@/lib/alumni";
import { ALUMNI_COURSE_LABELS } from "@/lib/alumni";

/**
 * The public alumni directory (round-9 restore of the round-6 module):
 * published registry rows only, contact-free by construction — the data layer
 * selects nothing it must not show. Link-based filters and pagination, so the
 * directory works without a line of client JavaScript.
 */

function directoryUrl(lang: Language, params: { q?: string; course?: string; page?: number }): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.course) sp.set("course", params.course);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return `/${lang}/about/alumni${qs ? `?${qs}` : ""}`;
}

export function AlumniDirectory({
  lang,
  result,
  q,
  course,
}: {
  lang: Language;
  result: AlumniDirectoryResult;
  q: string;
  course: string;
}) {
  const bn = lang === "bn";
  const hasFilters = q !== "" || course !== "";

  return (
    <div>
      {/* ——— search + facet chips ——— */}
      <form
        action={directoryUrl(lang, {})}
        method="get"
        className="mx-auto flex max-w-xl items-center gap-2"
        role="search"
      >
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={120}
            placeholder={bn ? "নাম, রেজিস্ট্রি নম্বর বা জেলা দিয়ে খুঁজুন…" : "Search by name, registry no, or district…"}
            aria-label={bn ? "অ্যালামনাই খুঁজুন" : "Search alumni"}
            className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-gold/60 focus:ring-2 focus:ring-gold/30"
          />
        </div>
        {course ? <input type="hidden" name="course" value={course} /> : null}
        <button
          type="submit"
          className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          {bn ? "খুঁজুন" : "Search"}
        </button>
      </form>

      {/* facet chips — every program with published rows */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Link
          href={directoryUrl(lang, { q: q || undefined })}
          aria-current={course === "" ? "true" : undefined}
          className={cn(
            "rounded-full border px-4 py-1.5 text-[12.5px] font-semibold transition-colors",
            course === ""
              ? "border-gold bg-gold/15 text-gold-foreground dark:text-gold"
              : "border-border bg-card text-muted-foreground hover:border-gold/50 hover:text-foreground",
          )}
        >
          {bn ? "সব কার্যক্রম" : "All programs"}
        </Link>
        {result.facets.map((facet) => (
          <Link
            key={facet.courseKey}
            href={directoryUrl(lang, { q: q || undefined, course: facet.courseKey })}
            aria-current={course === facet.courseKey ? "true" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-[12.5px] font-semibold transition-colors",
              course === facet.courseKey
                ? "border-gold bg-gold/15 text-gold-foreground dark:text-gold"
                : "border-border bg-card text-muted-foreground hover:border-gold/50 hover:text-foreground",
            )}
          >
            {pick(ALUMNI_COURSE_LABELS[facet.courseKey] ?? { bn: facet.courseKey, en: facet.courseKey }, lang)}
            <span className="ml-1.5 text-[11px] opacity-70">{toBnDigits(facet.count)}</span>
          </Link>
        ))}
      </div>

      {/* applied-search chip */}
      {q ? (
        <p className="mt-4 text-center">
          <Link
            href={directoryUrl(lang, { course: course || undefined })}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 py-1 pl-3 pr-2 text-[12.5px] font-medium transition-colors hover:border-gold hover:bg-gold/20"
          >
            {bn ? `«${q}» — এই অনুসন্ধানে ${toBnDigits(result.total)}টি মিল` : `“${q}” — ${result.total} match(es)`}
            <X aria-hidden className="h-3.5 w-3.5 text-gold-foreground/70" />
            <span className="sr-only">{bn ? "অনুসন্ধান মুছুন" : "Clear search"}</span>
          </Link>
        </p>
      ) : null}

      {/* ——— results ——— */}
      {result.rows.length === 0 ? (
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-gold/40 bg-card px-6 py-10 text-center">
          <Search aria-hidden className="mx-auto h-7 w-7 text-gold" />
          <p className="mt-3 text-[15px] font-bold">
            {hasFilters
              ? bn
                ? "কোনো প্রাক্তন পাওয়া যায়নি"
                : "No alumni found"
              : bn
                ? "ডিরেক্টরিটি এখনো খালি"
                : "The directory is empty"}
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {hasFilters
              ? bn
                ? "অন্য নাম বা কার্যক্রম দিয়ে চেষ্টা করুন।"
                : "Try another name or program."
              : bn
                ? "অফিস থেকে তালিকা প্রকাশ করা হলে এখানে দেখা যাবে।"
                : "Published entries will appear here once the office lists them."}
          </p>
          {hasFilters ? (
            <Link
              href={directoryUrl(lang, {})}
              className="mt-4 inline-block text-[12.5px] font-semibold text-gold-foreground underline-offset-4 hover:underline dark:text-gold"
            >
              {bn ? "সব ফিল্টার মুছুন" : "Clear all filters"}
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.rows.map((row, index) => (
            <Reveal key={row.id} delay={Math.min(index, 6) * 0.06}>
              <article className="group h-full rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md">
                <div className="flex items-start gap-3.5">
                  <span
                    aria-hidden
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/[0.08] text-lg font-bold text-primary"
                  >
                    {row.nameBn.trim().charAt(0) || "প"}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[15.5px] font-bold leading-snug" title={row.nameBn}>
                      {row.nameBn}
                    </h3>
                    <p className="mt-0.5 font-mono text-[11px] font-semibold tracking-wide text-muted-foreground" dir="ltr">
                      {row.registryNo}
                    </p>
                  </div>
                </div>
                <p className="mt-3.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-gold/30 bg-gold/[0.06] px-2 py-0.5 text-[11px] font-semibold text-gold-foreground dark:text-gold">
                    {pick(ALUMNI_COURSE_LABELS[row.courseKey] ?? { bn: row.courseKey, en: row.courseKey }, lang)}
                  </span>
                  <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {toBnDigits(row.batchYear)}
                    {row.batchNoBn ? ` — ${row.batchNoBn}` : ""}
                  </span>
                </p>
                <dl className="mt-4 space-y-2 border-t pt-3.5 text-[12.5px] leading-relaxed">
                  {row.occupationBn || row.occupationEn ? (
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-semibold text-muted-foreground">{bn ? "পেশা:" : "Occupation:"}</dt>
                      <dd className="min-w-0">{bn ? row.occupationBn || row.occupationEn : row.occupationEn || row.occupationBn}</dd>
                    </div>
                  ) : null}
                  {row.organizationBn || row.organizationEn ? (
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-semibold text-muted-foreground">{bn ? "প্রতিষ্ঠান:" : "Organization:"}</dt>
                      <dd className="min-w-0">{bn ? row.organizationBn || row.organizationEn : row.organizationEn || row.organizationBn}</dd>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-muted-foreground">{bn ? "জেলা:" : "District:"}</dt>
                    <dd>{bn ? row.districtBn || "—" : row.districtEn || row.districtBn || "—"}</dd>
                  </div>
                </dl>
              </article>
            </Reveal>
          ))}
        </div>
      )}

      {/* ——— pagination ——— */}
      {result.pageCount > 1 ? (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label={bn ? "পৃষ্ঠা সংখ্যা" : "Pagination"}>
          {result.page > 1 ? (
            <Link
              href={directoryUrl(lang, { q: q || undefined, course: course || undefined, page: result.page - 1 })}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
              aria-label={bn ? "আগের পৃষ্ঠা" : "Previous page"}
            >
              <ChevronLeft aria-hidden className="h-4 w-4" />
            </Link>
          ) : null}
          {pageNumbers(result.page, result.pageCount).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-muted-foreground" aria-hidden>
                …
              </span>
            ) : (
              <Link
                key={p}
                href={directoryUrl(lang, { q: q || undefined, course: course || undefined, page: p })}
                aria-current={p === result.page ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-bold transition-colors",
                  p === result.page
                    ? "border-gold bg-gold/15 text-gold-foreground dark:text-gold"
                    : "bg-card text-muted-foreground hover:border-gold/50 hover:text-foreground",
                )}
              >
                {toBnDigits(p)}
              </Link>
            ),
          )}
          {result.page < result.pageCount ? (
            <Link
              href={directoryUrl(lang, { q: q || undefined, course: course || undefined, page: result.page + 1 })}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
              aria-label={bn ? "পরের পৃষ্ঠা" : "Next page"}
            >
              <ChevronRight aria-hidden className="h-4 w-4" />
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

/** 1 … 4 5 6 … 12 — compact page list with gaps. */
function pageNumbers(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}
