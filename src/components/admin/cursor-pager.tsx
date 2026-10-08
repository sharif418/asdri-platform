import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsLeft } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Compact keyset pager for cursor-paginated admin tables (round 11, C.2).
 * The office walks chronologically — « newest, পূর্ববর্তী (newer window),
 * পরবর্তী (older window) — instead of jumping to a deep OFFSET page.
 * Disabled directions render as inert spans so the bar keeps its shape.
 */
export function CursorPager({
  shown,
  total,
  unit,
  prevHref,
  nextHref,
  resetHref,
  deep,
}: {
  shown: number;
  total: number;
  unit: string;
  prevHref: string | null;
  nextHref: string | null;
  /** "back to newest" — only offered once the officer has walked away. */
  resetHref: string | null;
  /** true when a cursor is active (drives the range hint's wording). */
  deep: boolean;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">
        {deep ? "পুরোনো দিকে " : "সর্বশেষ "}
        {formatNumber(shown, "bn")} {unit} · ফিল্টারে মোট {formatNumber(total, "bn")} {unit}
      </span>
      <nav className="flex gap-2" aria-label="পেজিং">
        {resetHref ? (
          <Link
            href={resetHref}
            className="inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 font-semibold hover:bg-secondary"
          >
            <ChevronsLeft aria-hidden className="h-3.5 w-3.5" /> সর্বশেষ
          </Link>
        ) : null}
        {prevHref ? (
          <Link
            href={prevHref}
            rel="prev"
            className="inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 font-semibold hover:bg-secondary"
          >
            <ChevronLeft aria-hidden className="h-3.5 w-3.5" /> পূর্ববর্তী
          </Link>
        ) : (
          <span aria-disabled="true" className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border bg-muted/40 px-3 py-1.5 font-semibold text-muted-foreground/60">
            <ChevronLeft aria-hidden className="h-3.5 w-3.5" /> পূর্ববর্তী
          </span>
        )}
        {nextHref ? (
          <Link
            href={nextHref}
            rel="next"
            className="inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 font-semibold hover:bg-secondary"
          >
            পরবর্তী <ChevronRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span aria-disabled="true" className={cn("inline-flex cursor-not-allowed items-center gap-1 rounded-lg border bg-muted/40 px-3 py-1.5 font-semibold text-muted-foreground/60")}>
            পরবর্তী <ChevronRight aria-hidden className="h-3.5 w-3.5" />
          </span>
        )}
      </nav>
    </div>
  );
}
