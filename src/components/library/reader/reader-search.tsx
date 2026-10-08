"use client";

import { SearchCheck } from "lucide-react";
import { toBnDigits } from "@/lib/format";
import type { Language } from "@/types";
import { cn } from "@/lib/utils";

/** One search hit: the page it lives on, a short context snippet, and the
 *  exact character range in the page's display text (drives the gold
 *  overlay on the canvas). */
export interface PdfSearchMatch {
  page: number;
  snippet: string;
  from: number;
  through: number;
}

/** Match cap — the list is a navigation aid, not an index. */
export const MAX_MATCHES = 100;

interface ReaderSearchResultsProps {
  lang: Language;
  query: string;
  matches: PdfSearchMatch[];
  searching: boolean;
  onJump: (page: number) => void;
  /** the page currently on the stage — its matches wear the gold ring
   *  (round-10 polish: the list and the canvas overlay speak together) */
  currentPage: number;
}

/**
 * The match list for the reader's in-document search — pdfjs's text layer
 * per page, matched case-insensitively, listed with context. Clicking a
 * match turns to its page; the matches on the page currently on the stage
 * wear a gold ring so the list and the canvas overlay read together.
 */
export function ReaderSearchResults({
  lang,
  query,
  matches,
  searching,
  onJump,
  currentPage,
}: ReaderSearchResultsProps) {
  const bn = lang === "bn";
  if (!query.trim()) return null;

  return (
    <div
      className="reader-chrome mt-3 rounded-2xl border bg-card p-4 shadow-sm"
      aria-live="polite"
    >
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        <SearchCheck aria-hidden className="h-3.5 w-3.5 text-gold" />
        {bn ? "অনুসন্ধানের ফলাফল" : "Search results"}
      </p>

      {searching ? (
        <p className="mt-2 text-[13px] text-muted-foreground">
          {bn ? "পৃষ্ঠাগুলো ঘাঁটা হচ্ছে…" : "Scanning the pages…"}
        </p>
      ) : matches.length === 0 ? (
        <p className="mt-2 text-[13px] text-muted-foreground">
          {bn
            ? `“${query}” শব্দটি এই ডকুমেন্টে পাওয়া যায়নি।`
            : `No occurrence of “${query}” in this document.`}
        </p>
      ) : (
        <>
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            {bn
              ? `${toBnDigits(matches.length)}টি মিল${matches.length >= MAX_MATCHES ? ` (প্রথম ${toBnDigits(MAX_MATCHES)}টি দেখানো হচ্ছে)` : ""}`
              : `${matches.length} ${matches.length === 1 ? "match" : "matches"}${matches.length >= MAX_MATCHES ? ` (showing the first ${MAX_MATCHES})` : ""}`}
          </p>
          <ul className="mt-3 grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {matches.map((match, index) => {
              const onStage = match.page === currentPage;
              return (
                <li key={`${match.page}-${index}`}>
                  <button
                    type="button"
                    onClick={() => onJump(match.page)}
                    aria-current={onStage ? "true" : undefined}
                    className={cn(
                      "relative w-full rounded-xl border bg-background/60 p-2.5 text-left transition-colors hover:border-gold/50 hover:bg-gold/5",
                      onStage && "border-gold/60 bg-gold/10 ring-1 ring-gold/50",
                    )}
                  >
                    {onStage ? (
                      <span
                        aria-hidden
                        className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-gold"
                        title={bn ? "এই পৃষ্ঠায় হাইলাইট হয়েছে" : "highlighted on this page"}
                      />
                    ) : null}
                    <span className={cn("text-[10.5px] font-bold uppercase tracking-wider", onStage ? "text-gold" : "text-gold/80")}>
                      {bn
                        ? `পৃষ্ঠা ${toBnDigits(match.page)}${onStage ? " · হাইলাইট" : ""}`
                        : `Page ${match.page}${onStage ? " · highlighted" : ""}`}
                    </span>
                    <span
                      className="mt-1 block line-clamp-2 text-[12.5px] leading-relaxed text-foreground/85"
                      dir="auto"
                    >
                      …{match.snippet}…
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
