import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { RESULT_ICON_FALLBACK, RESULT_ICONS, RESULT_TONES } from "@/components/search/result-icon";
import type { SearchEntryType } from "@/lib/search-index";
import type { Language } from "@/types";
import { cn } from "@/lib/utils";

export interface ResultCardData {
  id: string;
  type: SearchEntryType;
  href: string;
  title: string;
  excerpt: string;
  meta?: string;
}

interface ResultCardProps {
  result: ResultCardData;
  lang: Language;
  /** Active query — matched tokens are gold-highlighted in title/excerpt. */
  query?: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Renders text with each query token wrapped in a subtle gold mark. */
function Highlight({ text, query }: { text: string; query: string }) {
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map(escapeRegExp);
  if (tokens.length === 0 || text.length === 0) {
    return <>{text}</>;
  }
  const pattern = new RegExp(`(${tokens.join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="search-mark">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Single search result row — icon medallion, title, excerpt and real link. */
export function ResultCard({ result, lang, query = "" }: ResultCardProps) {
  const Icon = RESULT_ICONS[result.type] ?? RESULT_ICON_FALLBACK;
  const tone = RESULT_TONES[result.type] ?? "bg-secondary text-secondary-foreground";

  return (
    <li>
      <Link
        href={result.href}
        className="group flex items-start gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-emerald-950/5 sm:items-center sm:p-5"
      >
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg sm:mt-0",
            tone,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-serif text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-base">
            <Highlight text={result.title} query={query} />
          </span>
          {result.excerpt.length > 0 && (
            <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-muted-foreground">
              <Highlight text={result.excerpt} query={query} />
            </span>
          )}
          {result.meta && (
            <span className="mt-1.5 block text-[11px] font-medium uppercase tracking-wide text-gold">
              {result.meta}
            </span>
          )}
        </span>
        <ChevronRight
          aria-hidden
          className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-1 group-hover:text-primary sm:mt-0"
        />
      </Link>
    </li>
  );
}

interface ResultSectionProps {
  title: string;
  count: number;
  /** Optional “view all” deep link rendered under the cards. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** Labeled group of result cards with a gold count badge. */
export function ResultSection({ title, count, footer, children }: ResultSectionProps) {
  return (
    <section aria-label={title} className="scroll-mt-28">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="font-serif text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
        <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-bold text-gold-foreground tabular-nums dark:text-accent-foreground">
          {count}
        </span>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-gold/40 to-transparent" />
      </div>
      {/* grid-cols-1 = minmax(0,1fr): lets long truncated titles shrink at
          narrow viewports — an implicit auto track sizes to their nowrap
          min-content and overflows the page (same lesson as r6 prev/next). */}
      <ul className="grid grid-cols-1 gap-3">{children}</ul>
      {footer}
    </section>
  );
}
