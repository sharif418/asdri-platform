"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  Search,
} from "lucide-react";
import { toBnDigits } from "@/lib/format";
import type { Language } from "@/types";

/**
 * The reader's control band: page navigation (buttons + jump input), zoom
 * (fit-width default, ± steps, reset), in-document text search and print.
 * Presentational only — state lives in <PdfReader/>. Hidden when printing.
 */

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

interface ReaderToolbarProps {
  lang: Language;
  page: number;
  numPages: number;
  onPage: (page: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onSearch: (query: string) => void;
  searching: boolean;
  matchCount: number;
  hasQuery: boolean;
}

const controlBase =
  "inline-flex h-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:pointer-events-none disabled:opacity-40";

export function ReaderToolbar({
  lang,
  page,
  numPages,
  onPage,
  zoom,
  onZoomChange,
  onSearch,
  searching,
  matchCount,
  hasQuery,
}: ReaderToolbarProps) {
  const bn = lang === "bn";
  const digits = (value: number | string) =>
    bn ? toBnDigits(value) : String(value);
  const [jump, setJump] = useState("");
  const [query, setQuery] = useState("");

  function submitJump(event: React.FormEvent) {
    event.preventDefault();
    const target = Number.parseInt(jump, 10);
    if (Number.isFinite(target))
      onPage(Math.min(Math.max(1, target), Math.max(1, numPages)));
    setJump("");
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    onSearch(query);
  }

  return (
    <div className="reader-chrome rounded-2xl border border-gold/25 bg-card/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="flex flex-wrap items-center gap-2">
        {/* ————— page navigation ————— */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label={bn ? "পূর্ববর্তী পৃষ্ঠা" : "Previous page"}
            className={`${controlBase} w-9`}
          >
            <ChevronLeft aria-hidden className="h-4 w-4 rtl:rotate-180" />
          </button>
          <form
            onSubmit={submitJump}
            key={page}
            className="flex items-center gap-1.5"
          >
            <span className="text-[12.5px] font-semibold tabular-nums text-foreground">
              {digits(page)} / {digits(Math.max(1, numPages))}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={Math.max(1, numPages)}
              value={jump}
              onChange={(event) => setJump(event.target.value)}
              placeholder={digits(page)}
              aria-label={bn ? "পৃষ্ঠা নম্বর লিখে যান" : "Jump to page"}
              className="h-9 w-16 rounded-lg border bg-background px-2 text-center text-[12.5px] tabular-nums outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/30"
            />
            <button
              type="submit"
              className={`${controlBase} px-2.5 text-[12px] font-semibold`}
            >
              {bn ? "যান" : "Go"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => onPage(page + 1)}
            disabled={numPages > 0 && page >= numPages}
            aria-label={bn ? "পরবর্তী পৃষ্ঠা" : "Next page"}
            className={`${controlBase} w-9`}
          >
            <ChevronRight aria-hidden className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>

        {/* ————— zoom ————— */}
        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-label={bn ? "জুম" : "Zoom"}
        >
          <button
            type="button"
            onClick={() =>
              onZoomChange(
                Math.max(MIN_ZOOM, Math.round((zoom - ZOOM_STEP) * 100) / 100),
              )
            }
            disabled={zoom <= MIN_ZOOM}
            aria-label={bn ? "ছোট করুন" : "Zoom out"}
            className={`${controlBase} w-9`}
          >
            <Minus aria-hidden className="h-4 w-4" />
          </button>
          <span className="min-w-[3.25rem] text-center text-[12.5px] font-semibold tabular-nums text-foreground">
            {digits(Math.round(zoom * 100))}%
          </span>
          <button
            type="button"
            onClick={() =>
              onZoomChange(
                Math.min(MAX_ZOOM, Math.round((zoom + ZOOM_STEP) * 100) / 100),
              )
            }
            disabled={zoom >= MAX_ZOOM}
            aria-label={bn ? "বড় করুন" : "Zoom in"}
            className={`${controlBase} w-9`}
          >
            <Plus aria-hidden className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(1)}
            aria-label={
              bn ? "জুম রিসেট (পৃষ্ঠা-প্রস্থ)" : "Reset zoom (fit width)"
            }
            className={`${controlBase} w-9`}
          >
            <RotateCcw aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <p className="ml-auto hidden items-center gap-1.5 text-[11.5px] text-muted-foreground xl:flex">
          <kbd className="rounded border bg-secondary/60 px-1.5 py-0.5 font-sans">
            ←
          </kbd>
          <kbd className="rounded border bg-secondary/60 px-1.5 py-0.5 font-sans">
            →
          </kbd>
          {bn ? "দিয়ে পৃষ্ঠা বদলান" : "to turn pages"}
        </p>

        {/* ————— print ————— */}
        <button
          type="button"
          onClick={() => window.print()}
          aria-label={bn ? "এই পৃষ্ঠা প্রিন্ট করুন" : "Print this page"}
          className={`${controlBase} w-9`}
        >
          <Printer aria-hidden className="h-4 w-4" />
        </button>
      </div>

      {/* ————— in-document search ————— */}
      <form onSubmit={submitSearch} className="mt-2.5 flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={80}
            placeholder={
              bn
                ? "ডকুমেন্টের ভেতরে শব্দ খুঁজুন…"
                : "Find words inside the document…"
            }
            aria-label={
              bn ? "ডকুমেন্টে অনুসন্ধান" : "Search inside the document"
            }
            className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/30"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {searching ? (
            <>
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              {bn ? "খোঁজা হচ্ছে…" : "Searching…"}
            </>
          ) : (
            <>
              <Search aria-hidden className="h-4 w-4" />
              {bn ? "খুঁজুন" : "Find"}
            </>
          )}
        </button>
        {hasQuery ? (
          <span
            role="status"
            className="min-w-[7.5rem] text-center text-[12px] font-semibold text-muted-foreground"
          >
            {searching
              ? bn
                ? "খোঁজা হচ্ছে…"
                : "Searching…"
              : bn
                ? `${toBnDigits(matchCount)}টি মিল`
                : `${matchCount} ${matchCount === 1 ? "match" : "matches"}`}
          </span>
        ) : null}
      </form>
    </div>
  );
}
