"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Loader2, Megaphone, ScrollText, Search, SearchX } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useLanguage } from "@/components/providers/language-provider";
import {
  POPULAR_QUERIES,
  entryExcerpt,
  entryTitle,
  searchStaticEntries,
  type SearchEntry,
  type SearchEntryType,
} from "@/lib/search-index";
import { RESULT_ICON_FALLBACK, RESULT_ICONS } from "@/components/search/result-icon";
import { usePaletteLiveSearch, type LiveFatwaItem, type LiveNoticeItem } from "@/hooks/use-palette-live-search";
import { pick } from "@/types";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_LINKS: { href: string; titleBn: string; titleEn: string; entryType: SearchEntryType }[] = [
  { href: "/academics/courses", titleBn: "চলমান কোর্সসমূহ", titleEn: "Current Courses", entryType: "course" },
  { href: "/admissions", titleBn: "ভর্তি প্রক্রিয়া", titleEn: "Admissions", entryType: "page" },
  { href: "/research/fatwa", titleBn: "ফতোয়া ব্যাংক", titleEn: "Fatwa Bank", entryType: "fatwa" },
  { href: "/notices", titleBn: "নোটিশ বোর্ড", titleEn: "Notice Board", entryType: "notice" },
  { href: "/support/zakat-calculator", titleBn: "যাকাত ক্যালকুলেটর", titleEn: "Zakat Calculator", entryType: "action" },
  { href: "/support?fund=sponsor", titleBn: "শিক্ষার্থী স্পন্সর করুন", titleEn: "Sponsor a Student", entryType: "action" },
];

/** Global ⌘K / Ctrl+K command palette — instant navigation across the site. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset the query each time the palette opens (React's documented
  // "adjust state during render" pattern — no effect, no cascading render).
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setQuery("");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const hits = useMemo(() => searchStaticEntries(query, 9), [query]);
  const live = usePaletteLiveSearch(query);
  const trimmed = query.trim();

  function go(href: string): void {
    onOpenChange(false);
    router.push(href);
  }

  function goFullSearch(): void {
    go(trimmed.length > 0 ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  function renderEntryItem(entry: SearchEntry, keyPrefix: string) {
    const Icon = RESULT_ICONS[entry.type] ?? RESULT_ICON_FALLBACK;
    return (
      <CommandItem
        key={`${keyPrefix}:${entry.id}`}
        value={`${entryTitle(entry, lang)} ${entryTitle(entry, "en")} ${entry.href}`}
        onSelect={() => go(entry.href)}
        className="gap-3 rounded-lg"
      >
        <Icon aria-hidden className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{entryTitle(entry, lang)}</span>
          {entryExcerpt(entry, lang).length > 0 && (
            <span className="block truncate text-xs text-muted-foreground">
              {entryExcerpt(entry, lang)}
            </span>
          )}
        </span>
      </CommandItem>
    );
  }

  function renderNoticeItem(notice: LiveNoticeItem) {
    return (
      <CommandItem
        key={`live-notice:${notice.slug}`}
        value={`${notice.titleBn} ${notice.titleEn} ${notice.slug}`}
        onSelect={() => go(`/notices?notice=${encodeURIComponent(notice.slug)}`)}
        className="gap-3 rounded-lg"
      >
        <Megaphone aria-hidden className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {lang === "bn" ? notice.titleBn : notice.titleEn}
          </span>
          {(lang === "bn" ? notice.excerptBn : notice.excerptEn).length > 0 && (
            <span className="block truncate text-xs text-muted-foreground">
              {lang === "bn" ? notice.excerptBn : notice.excerptEn}
            </span>
          )}
        </span>
      </CommandItem>
    );
  }

  function renderFatwaItem(fatwa: LiveFatwaItem) {
    return (
      <CommandItem
        key={`live-fatwa:${fatwa.slug}`}
        value={`${fatwa.questionBn} ${fatwa.questionEn} ${fatwa.slug}`}
        onSelect={() => go(`/research/fatwa?focus=${encodeURIComponent(fatwa.slug)}`)}
        className="gap-3 rounded-lg"
      >
        <ScrollText aria-hidden className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {lang === "bn" ? fatwa.questionBn : fatwa.questionEn}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {lang === "bn" ? `${fatwa.answeredBy} কর্তৃক উত্তরপ্রাপ্ত` : `Answered by ${fatwa.answeredBy}`}
          </span>
        </span>
      </CommandItem>
    );
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("search.title")}
      description={t("search.subtitle")}
      className="sm:max-w-[540px]"
    >
      <Command shouldFilter={trimmed.length === 0}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={t("search.placeholder")}
          className="text-[14px]"
        />

        <CommandList className="max-h-[min(60vh,420px)] py-2">
          {trimmed.length === 0 ? (
            <>
              <CommandGroup heading={t("search.actions")}>
                {QUICK_LINKS.map((link) => {
                  const Icon = RESULT_ICONS[link.entryType] ?? RESULT_ICON_FALLBACK;
                  return (
                    <CommandItem
                      key={`quick:${link.href}`}
                      value={`${link.titleBn} ${link.titleEn} ${link.href}`}
                      onSelect={() => go(link.href)}
                      className="gap-3 rounded-lg"
                    >
                      <Icon aria-hidden className="h-4 w-4 shrink-0 text-gold" />
                      <span className="text-sm font-medium">
                        {lang === "bn" ? link.titleBn : link.titleEn}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading={t("search.popular")}>
                {POPULAR_QUERIES.slice(0, 5).map((item) => (
                  <CommandItem
                    key={`pop:${item.q}`}
                    value={`${item.bn} ${item.en} ${item.q}`}
                    onSelect={() => go(`/search?q=${encodeURIComponent(item.q)}`)}
                    className="gap-3 rounded-lg"
                  >
                    <span
                      aria-hidden
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-gold-soft text-[10px] font-bold text-gold-foreground dark:text-accent-foreground"
                    >
                      ?
                    </span>
                    <span className="text-sm">{pick({ bn: item.bn, en: item.en }, lang)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : hits.length === 0 && live.notices.length === 0 && live.fatwas.length === 0 && !live.loading ? (
            <CommandEmpty>
              <SearchX aria-hidden className="mx-auto h-6 w-6 text-muted-foreground/60" />
              <span className="mt-2 block text-sm text-muted-foreground">{t("search.noResults")}</span>
            </CommandEmpty>
          ) : (
            <>
              {hits.length > 0 && (
                <CommandGroup heading={t("search.resultsFor")}>
                  {hits.map((hit) => renderEntryItem(hit.entry, "hit"))}
                </CommandGroup>
              )}
              {hits.length > 0 && live.notices.length > 0 && <CommandSeparator />}
              {live.notices.length > 0 && (
                <CommandGroup heading={t("search.notices")}>
                  {live.notices.map((notice) => renderNoticeItem(notice))}
                </CommandGroup>
              )}
              {(hits.length > 0 || live.notices.length > 0) && live.fatwas.length > 0 && <CommandSeparator />}
              {live.fatwas.length > 0 && (
                <CommandGroup heading={t("search.fatwas")}>
                  {live.fatwas.map((fatwa) => renderFatwaItem(fatwa))}
                </CommandGroup>
              )}
              {live.loading && (
                <div role="status" className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin text-primary" />
                  {t("search.liveSearching")}
                </div>
              )}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  value={`__full_search__ ${trimmed}`}
                  onSelect={goFullSearch}
                  className="justify-between rounded-lg border border-gold/30 bg-gold-soft/40"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Search aria-hidden className="h-4 w-4" />
                    {t("search.fullResults")} — “{trimmed}”
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    {t("search.hintKbd")}
                    <CornerDownLeft aria-hidden className="h-3.5 w-3.5" />
                  </span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>

        <div
          aria-hidden
          className="flex items-center justify-between border-t border-border/70 bg-secondary/40 px-4 py-2 text-[11px] text-muted-foreground"
        >
          <span>{t("search.hintKbd")}</span>
          <span className="font-medium text-gold">{t("search.shortcut")}</span>
        </div>
      </Command>
    </CommandDialog>
  );
}

/** Header button that opens the command palette (with optional Ctrl K hint). */
export function SearchTrigger({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("search.open")}
      aria-keyshortcuts="Control+K"
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-[13px] text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground",
        className,
      )}
    >
      <Search aria-hidden className="h-4 w-4" />
      <span className="hidden xl:inline">{t("search.submit")}</span>
      <kbd
        aria-hidden
        className="hidden rounded border bg-secondary px-1.5 py-0.5 text-[10px] font-semibold xl:inline-block"
      >
        {t("search.shortcut")}
      </kbd>
    </button>
  );
}
