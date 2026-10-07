"use client";

import { SearchCheck } from "lucide-react";
import { toBnDigits } from "@/lib/format";
import type { Language } from "@/types";

/** One search hit: the page it lives on plus a short context snippet. */
export interface PdfSearchMatch {
  page: number;
  snippet: string;
}

/** Match cap — the list is a navigation aid, not an index. */
export const MAX_MATCHES = 100;

interface ReaderSearchResultsProps {
  lang: Language;
  query: string;
  matches: PdfSearchMatch[];
  searching: boolean;
  onJump: (page: number) => void;
}

/**
 * The match list for the reader's in-document search — pdfjs's text layer
 * per page, matched case-insensitively, listed with context. Clicking a
 * match turns to its page (overlay highlighting stays out of scope: the
 * canvas text layer would need its own geometry pass).
 */
export function ReaderSearchResults({
  lang,
  query,
  matches,
  searching,
  onJump,
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
            {matches.map((match, index) => (
              <li key={`${match.page}-${index}`}>
                <button
                  type="button"
                  onClick={() => onJump(match.page)}
                  className="w-full rounded-xl border bg-background/60 p-2.5 text-left transition-colors hover:border-gold/50 hover:bg-gold/5"
                >
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-gold">
                    {bn
                      ? `পৃষ্ঠা ${toBnDigits(match.page)}`
                      : `Page ${match.page}`}
                  </span>
                  <span
                    className="mt-1 block line-clamp-2 text-[12.5px] leading-relaxed text-foreground/85"
                    dir="auto"
                  >
                    …{match.snippet}…
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
