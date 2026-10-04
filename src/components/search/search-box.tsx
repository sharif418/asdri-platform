"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { langPath } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface SearchBoxProps {
  initialQuery?: string;
  autoFocus?: boolean;
  size?: "default" | "hero";
  className?: string;
}

/** Controlled search input — GET-submits to /search with a debounced navigation. */
export function SearchBox({ initialQuery = "", autoFocus = false, size = "default", className }: SearchBoxProps) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function submit(query: string): void {
    const trimmed = query.trim();
    router.push(langPath(lang, trimmed.length > 0 ? `/search?q=${encodeURIComponent(trimmed)}` : "/search"));
  }

  const hero = size === "hero";

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        submit(value);
      }}
      className={cn(
        "group relative mx-auto flex w-full items-center gap-2",
        hero
          ? "rounded-xl border border-gold/30 bg-card p-2 shadow-md shadow-black/20 transition duration-300 focus-within:border-gold/70"
          : "rounded-xl border bg-card p-1.5 transition-colors focus-within:border-primary/60",
        className,
      )}
    >
      <Search
        aria-hidden
        className={cn("ml-2 shrink-0 text-primary", hero ? "h-5 w-5" : "h-4 w-4")}
      />
      <label htmlFor="site-search-input" className="sr-only">
        {t("search.title")}
      </label>
      <input
        ref={inputRef}
        id="site-search-input"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("search.placeholder")}
        aria-label={t("search.title")}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/70 focus:outline-none",
          hero ? "h-11 text-[16px]" : "h-9 text-sm",
        )}
      />
      {value.length > 0 && (
        <button
          type="button"
          aria-label={lang === "bn" ? "অনুসন্ধান মুছুন" : "Clear search"}
          onClick={() => {
            setValue("");
            inputRef.current?.focus();
          }}
          className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X aria-hidden className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="submit"
        className={cn(
          "shrink-0 rounded-lg bg-primary font-medium text-primary-foreground transition-opacity hover:opacity-90",
          hero ? "h-11 px-4 text-sm sm:px-6" : "h-9 px-4 text-[13px]",
        )}
      >
        {t("search.submit")}
      </button>
    </form>
  );
}
