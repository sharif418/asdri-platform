import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import type { Lang } from "@/lib/locale";
import { toBnDigits } from "@/lib/format";
import { pageWindow } from "@/lib/pagination";
import { cn } from "@/lib/utils";

/**
 * Shared numbered pagination bar (notice board, blog, …). Server component:
 * plain links, gold hover/focus rings, Bengali digits on bn, aria-current on
 * the active page and a sr-only "page X of Y" status line. The window
 * (1 … n) comes from the pure pageWindow() helper; chevron buttons render
 * disabled spans at the ends. Emerald/gold only — no indigo/blue.
 */

export interface SitePaginationLabels {
  /** Previous-page chevron aria-label. */
  prev: string;
  /** Next-page chevron aria-label. */
  next: string;
  /** nav aria-label. */
  nav: string;
  /** Per-page-link aria label, e.g. "পাতা ৩". */
  page: (page: number) => string;
  /** sr-only status, e.g. "পাতা ৩ / ৮". */
  status: (page: number, totalPages: number) => string;
}

interface SitePaginationProps {
  page: number;
  totalPages: number;
  /** Absolute href for a page link (callers keep their own query params). */
  buildUrl: (page: number) => string;
  lang: Lang;
  labels: SitePaginationLabels;
  /** Pages on each side of the current page (default 2). */
  siblings?: number;
}

export function SitePagination({
  page,
  totalPages,
  buildUrl,
  lang,
  labels,
  siblings = 2,
}: SitePaginationProps) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(1, page), totalPages);
  const digits = (value: number) => (lang === "bn" ? toBnDigits(value) : String(value));
  const items = pageWindow(current, totalPages, { siblings });

  const chevronBase =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";
  const chevronEnabled = "text-muted-foreground hover:border-gold/50 hover:text-foreground";

  return (
    <nav
      aria-label={labels.nav}
      className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
    >
      <p className="sr-only">{labels.status(current, totalPages)}</p>
      {current > 1 ? (
        <Link
          href={buildUrl(current - 1)}
          aria-label={labels.prev}
          className={cn(chevronBase, chevronEnabled)}
        >
          <ChevronLeft aria-hidden className="h-4 w-4" />
        </Link>
      ) : (
        <span aria-hidden className={cn(chevronBase, "pointer-events-none border-transparent bg-transparent text-muted-foreground/40")}>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {items.map((item, index) =>
        item.type === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden
            className="inline-flex h-10 w-10 items-center justify-center text-muted-foreground/60"
          >
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <Link
            key={item.page}
            href={buildUrl(item.page)}
            aria-current={item.page === current ? "page" : undefined}
            aria-label={labels.page(item.page)}
            className={cn(
              "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
              item.page === current
                ? "bg-primary text-primary-foreground shadow-md"
                : "border bg-card text-muted-foreground hover:border-gold/50 hover:text-foreground",
            )}
          >
            {digits(item.page)}
          </Link>
        ),
      )}

      {current < totalPages ? (
        <Link
          href={buildUrl(current + 1)}
          aria-label={labels.next}
          className={cn(chevronBase, chevronEnabled)}
        >
          <ChevronRight aria-hidden className="h-4 w-4" />
        </Link>
      ) : (
        <span aria-hidden className={cn(chevronBase, "pointer-events-none border-transparent bg-transparent text-muted-foreground/40")}>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
