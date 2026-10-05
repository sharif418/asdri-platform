import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Numbered deep-pagination bar for admin tables (Bengali numerals).
 * Server-rendered links only — every page is one click away through a
 * windowed number line (1 … p-1 p p+1 … last) instead of prev/next crawling.
 */

interface AdminPagerProps {
  page: number;
  pageCount: number;
  total: number;
  /** Bengali unit label, e.g. "আবেদন" / "অনুদান" / "এন্ট্রি". */
  unit: string;
  /** Builds the href for a page — callers keep their active filters. */
  buildHref: (page: number) => string;
  className?: string;
}

type PagerItem = { kind: "page"; value: number } | { kind: "gap" };

/** Windowed page line: first/last always shown, ±1 around current, gaps as “…”. */
export function pagerItems(page: number, pageCount: number): PagerItem[] {
  const wanted = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  const items: PagerItem[] = [];
  let previous = 0;
  for (let value = 1; value <= pageCount; value += 1) {
    if (!wanted.has(value)) continue;
    if (value - previous > 1) items.push({ kind: "gap" });
    items.push({ kind: "page", value });
    previous = value;
  }
  return items;
}

export function AdminPager({ page, pageCount, total, unit, buildHref, className }: AdminPagerProps) {
  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label="পৃষ্ঠা নেভিগেশন"
      className={cn("mt-4 flex flex-wrap items-center justify-between gap-3 text-sm", className)}
    >
      <span className="text-muted-foreground">
        পৃষ্ঠা {formatNumber(page, "bn")} / {formatNumber(pageCount, "bn")} · মোট {formatNumber(total, "bn")} {unit}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 font-semibold transition-colors hover:bg-secondary"
          >
            <ChevronLeft aria-hidden className="h-3.5 w-3.5" /> পূর্ববর্তী
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-1 rounded-lg border bg-card/50 px-3 py-1.5 font-semibold text-muted-foreground/50"
          >
            <ChevronLeft aria-hidden className="h-3.5 w-3.5" /> পূর্ববর্তী
          </span>
        )}

        {pagerItems(page, pageCount).map((item, index) =>
          item.kind === "gap" ? (
            <span key={`gap-${index}`} aria-hidden className="px-1 select-none text-muted-foreground">
              …
            </span>
          ) : (
            <Link
              key={item.value}
              href={buildHref(item.value)}
              aria-current={item.value === page ? "page" : undefined}
              aria-label={`পৃষ্ঠা ${formatNumber(item.value, "bn")}`}
              className={cn(
                "min-w-9 rounded-lg px-3 py-1.5 text-center font-semibold tabular-nums transition-colors",
                item.value === page
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border bg-card hover:bg-secondary",
              )}
            >
              {formatNumber(item.value, "bn")}
            </Link>
          ),
        )}

        {page < pageCount ? (
          <Link
            href={buildHref(page + 1)}
            className="inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 font-semibold transition-colors hover:bg-secondary"
          >
            পরবর্তী <ChevronRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-1 rounded-lg border bg-card/50 px-3 py-1.5 font-semibold text-muted-foreground/50"
          >
            পরবর্তী <ChevronRight aria-hidden className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </nav>
  );
}
