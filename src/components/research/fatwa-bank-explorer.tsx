"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookMarked,
  ChevronDown,
  Loader2,
  Printer,
  Search,
  SearchX,
  Share2,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "@/hooks/use-toast";
import { formatDate, toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import type { FatwaCategory, Language } from "@/types";
import { fatwaCategoryLabel, fatwaCategoryOptions, type FatwaDto, type FatwaListResponse } from "./fatwa-shared";

const PAGE_SIZE = 6;

type CategoryFilter = "all" | FatwaCategory;

interface FatwaBankExplorerProps {
  lang: Language;
  /** Deep-link initial search term (from ?q=). */
  initialQuery?: string;
  /** Deep-link slug to fetch, expand, and scroll to (from ?focus=). */
  focusSlug?: string;
}

/**
 * The full fatwa bank — server-searched (q/category/page) with category
 * tabs, expandable answers, official-pad print, share, and load-more.
 * Supports ?q= / ?focus= deep links (palette, admin, shares).
 */
export function FatwaBankExplorer({ lang, initialQuery = "", focusSlug = "" }: FatwaBankExplorerProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<FatwaDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const debounceTimer = useRef<number | null>(null);
  const firstLoad = useRef(true);

  // Debounce the search input.
  useEffect(() => {
    if (debounceTimer.current !== null) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      setDebounced(query.trim());
    }, 350);
    return () => {
      if (debounceTimer.current !== null) window.clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const fetchPage = useCallback(
    async (targetPage: number, mode: "replace" | "append") => {
      if (mode === "append") setLoadingMore(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
        if (debounced) params.set("q", debounced);
        if (category !== "all") params.set("category", category);
        const res = await fetch(`/api/fatwa?${params.toString()}`);
        if (!res.ok) throw new Error("request failed");
        const payload: FatwaListResponse = await res.json();
        setTotal(payload.data.total);
        setPage(payload.data.page);
        setItems((prev) => (mode === "append" ? [...prev, ...payload.data.items] : payload.data.items));
        if (mode === "replace") setExpanded(null);
      } catch {
        toast({ title: t("toast.error"), variant: "destructive" });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, debounced, t],
  );

  /** Initial load — honors a ?focus= deep-link slug (fetch + expand + scroll). */
  const fetchInitial = useCallback(async () => {
    const slug = focusSlug.trim();
    setLoading(true);
    try {
      if (!slug) {
        await fetchPage(1, "replace");
        return;
      }
      const [focusRes, listRes] = await Promise.all([
        fetch(`/api/fatwa?slug=${encodeURIComponent(slug)}`),
        fetch(`/api/fatwa?page=1&pageSize=${PAGE_SIZE}`),
      ]);
      const focused: FatwaDto | undefined = focusRes.ok
        ? (await focusRes.json()).data.items[0]
        : undefined;
      const listItems = listRes.ok ? (await listRes.json()).data : null;
      if (listItems) {
        const deduped = focused
          ? listItems.items.filter((item) => item.id !== focused.id)
          : listItems.items;
        setItems(focused ? [focused, ...deduped] : listItems.items);
        setTotal(focused ? listItems.total + 1 - (listItems.items.length - deduped.length) : listItems.total);
        setPage(1);
      } else if (focused) {
        setItems([focused]);
        setTotal(1);
      }
      if (focused) {
        setExpanded(focused.id);
        setFocusedId(focused.id);
        window.setTimeout(() => setFocusedId(null), 5000);
        window.requestAnimationFrame(() => {
          document
            .querySelector(`[data-fatwa-entry="${focused.id}"]`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [focusSlug, fetchPage, t]);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      void fetchInitial();
      return;
    }
    void fetchPage(1, "replace");
  }, [fetchPage, fetchInitial]);

  const hasMore = items.length < total;
  const searchPlaceholder = lang === "bn"
    ? "প্রশ্ন বা উত্তরে কী-ওয়ার্ড লিখুন (যেমন: যাকাত, কিবলা, ব্যাংক)…"
    : "Search by keyword (e.g. zakat, qiblah, bank)…";

  async function shareFatwa(entry: FatwaDto) {
    const text = `${pick(entry.question, lang)}\n\n${lang === "bn" ? "— ফতোয়া ব্যাংক" : "— Fatwa Bank"}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: lang === "bn" ? "ফতোয়া" : "Fatwa", text, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      toast({ title: t("action.copied") });
    } catch {
      // dismissed — nothing to report
    }
  }

  /** Print the currently expanded fatwa as the official pad (Save-as-PDF). */
  function printFatwa(entry: FatwaDto) {
    setExpanded(entry.id);
    document.body.classList.add("printing-fatwa");
    const cleanup = () => {
      document.body.classList.remove("printing-fatwa");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    // Fallback cleanup for browsers that never fire afterprint.
    window.setTimeout(cleanup, 1500);
  }

  return (
    <div>
      {/* search + filter */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={t("action.search")}
            className="h-11 pl-9"
          />
        </div>
        <div
          role="group"
          aria-label={lang === "bn" ? "ক্যাটাগরি ফিল্টার" : "Category filter"}
          className="scrollbar-thin flex gap-2 overflow-x-auto pb-1"
        >
          {[{ value: "all" as const, labelBn: "সকল", labelEn: "All" }, ...fatwaCategoryOptions].map((option) => {
            const active = category === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                aria-pressed={active}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border border-border bg-card text-muted-foreground hover:border-gold/50 hover:text-foreground"
                }`}
              >
                {lang === "bn" ? option.labelBn : option.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* result count */}
      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {loading ? (
          lang === "bn" ? "অনুসন্ধান চলছে…" : "Searching…"
        ) : (
          <>
            {lang === "bn"
              ? `মোট ${toBnDigits(total)} টি ফতোয়া পাওয়া গেছে`
              : `${total} fatwas found`}
            {debounced ? (
              <>
                {" · "}
                “{debounced}”
              </>
            ) : null}
          </>
        )}
      </p>

      {/* list */}
      <div className="mt-5 space-y-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border bg-card p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
            ))
          : items.length === 0
            ? (
              <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
                <SearchX aria-hidden className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-4 font-semibold">{t("label.noResults")}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {lang === "bn"
                    ? "অন্য কী-ওয়ার্ড দিয়ে খুঁজুন অথবা নিচের ফর্মে সরাসরি প্রশ্ন পাঠান।"
                    : "Try another keyword or submit your question directly in the form below."}
                </p>
              </div>
            )
            : items.map((entry) => {
                const open = expanded === entry.id;
                return (
                  <article
                    key={entry.id}
                    data-fatwa-entry={entry.id}
                    className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition-all ${
                      open ? "border-gold/60 shadow-md print-zone" : "hover:border-gold/40"
                    } ${focusedId === entry.id ? "ring-2 ring-gold/50 animate-focus-pulse" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : entry.id)}
                      aria-expanded={open}
                      className="flex w-full items-start justify-between gap-4 p-5 text-left sm:p-6"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-[10px] font-bold text-gold">
                            {fatwaCategoryLabel(entry.category, lang)}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{formatDate(entry.publishedAt, lang)}</span>
                        </div>
                        <h3 className="mt-2.5 text-[15px] font-semibold leading-snug sm:text-base">
                          {pick(entry.question, lang)}
                        </h3>
                      </div>
                      <ChevronDown
                        aria-hidden
                        className={`mt-1 h-5 w-5 shrink-0 text-gold transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                      />
                    </button>

                    {open ? (
                      <div className="border-t bg-parchment/60 px-5 pb-6 pt-5 sm:px-6">
                        {/* print-only official pad header */}
                        <header className="hidden print:mb-6 print:block print:border-b-2 print:border-black print:pb-4 print:text-center">
                          <p className="font-heading text-lg font-bold">{lang === "bn" ? "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট" : "As-Sunnah Dawah & Research Institute"}</p>
                          <p className="mt-1 text-sm">
                            {lang === "bn" ? "ফিকহ ও গবেষণা বোর্ড — ফতোয়া প্যাড" : "Fiqh & Research Board — Fatwa Pad"}
                          </p>
                        </header>
                        <p className="sr-only print:block">{lang === "bn" ? "উত্তর:" : "Answer:"}</p>
                        <div className="space-y-3.5">
                          {pick(entry.answer, lang).split(/\n+/).map((paragraph, index) =>
                            paragraph.trim() ? (
                              <p key={index} className="text-sm leading-[1.95] text-foreground/90">
                                {paragraph.trim()}
                              </p>
                            ) : null,
                          )}
                        </div>
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                          <p className="flex items-center gap-2 text-[13px] font-semibold text-primary">
                            <UserCheck aria-hidden className="h-4 w-4 text-gold" />— {entry.answeredBy}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => printFatwa(entry)}
                              className="h-8 gap-1.5 bg-primary px-3.5 text-[12px] font-semibold hover:bg-primary/90"
                            >
                              <Printer aria-hidden className="h-3.5 w-3.5" />
                              {lang === "bn" ? "অফিসিয়াল প্যাড (PDF)" : "Official Pad (PDF)"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void shareFatwa(entry)}
                              className="h-8 gap-1.5 border-gold/50 px-3.5 text-[12px] font-semibold text-gold hover:bg-gold hover:text-gold-foreground"
                            >
                              <Share2 aria-hidden className="h-3.5 w-3.5" />
                              {t("label.share")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
      </div>

      {/* load more */}
      {hasMore && !loading ? (
        <div className="mt-8 text-center">
          <Button
            type="button"
            variant="outline"
            disabled={loadingMore}
            onClick={() => void fetchPage(page + 1, "append")}
            className="gap-2 rounded-full border-gold/50 px-8 font-semibold text-gold hover:bg-gold hover:text-gold-foreground"
          >
            {loadingMore ? (
              <>
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                {t("action.sending")}
              </>
            ) : (
              <>
                <BookMarked aria-hidden className="h-4 w-4" />
                {lang === "bn"
                  ? `আরও দেখুন (${toBnDigits(items.length)}/${toBnDigits(total)})`
                  : `Load more (${items.length}/${total})`}
              </>
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
