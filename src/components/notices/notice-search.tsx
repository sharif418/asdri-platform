"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NoticeSearchProps {
  initialQuery: string;
  /** Current category to preserve while searching. */
  category: string | undefined;
}

/**
 * Notice search island: debounced push of ?q= (Enter submits instantly).
 * The heavy lifting (DB query, render) stays on the server.
 */
export function NoticeSearch({ initialQuery, category }: NoticeSearchProps) {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  function pushSearch(query: string): void {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    const qs = params.toString();
    router.push(qs ? `/notices?${qs}` : "/notices");
  }

  // Debounced auto-search while typing.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (value.trim() !== initialQuery) {
        pushSearch(value);
      }
    }, 450);
    return () => window.clearTimeout(id);
  }, [value, initialQuery, category, router]);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    pushSearch(value);
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label={lang === "bn" ? "নোটিশ খুঁজুন" : "Search notices"}
      className="relative mx-auto flex w-full max-w-xl items-center gap-2"
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={
          lang === "bn"
            ? "নোটিশের শিরোনাম বা সারসংক্ষেপ লিখে খুঁজুন…"
            : "Search by notice title or summary…"
        }
        aria-label={t("action.search")}
        className="h-11 rounded-full border-border bg-card pl-10 pr-10 text-sm shadow-sm focus-visible:ring-gold/60"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue("");
            if (initialQuery) pushSearch("");
          }}
          aria-label={lang === "bn" ? "খুঁজে ফেলার শব্দ মুছুন" : "Clear search"}
          className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X aria-hidden className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <Button
        type="submit"
        className="h-11 shrink-0 rounded-full px-5 font-semibold"
        aria-label={t("action.search")}
      >
        <Search aria-hidden className="h-4 w-4 sm:hidden" />
        <span className="hidden sm:inline">{t("action.search")}</span>
      </Button>
    </form>
  );
}
