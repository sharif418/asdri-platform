"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ListOrdered } from "lucide-react";
import type { TocHeading } from "@/lib/article";
import { useLanguage } from "@/components/providers/language-provider";
import { toBnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ArticleTocProps {
  /** Headings extracted server-side (≥3 rendered by the page). */
  headings: TocHeading[];
  className?: string;
}

/**
 * Collapsible article table of contents ("সূচিপত্র"): anchored links to
 * the prose heading ids, gold left rail, and IntersectionObserver-driven
 * active-section highlight. Deep-linked loads (#fragment) highlight the
 * target section immediately on mount. Smooth scrolling comes from the
 * global `scroll-behavior: smooth` (disabled under prefers-reduced-motion).
 */
export function ArticleToc({ headings, className }: ArticleTocProps) {
  const { t, lang } = useLanguage();
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    // Deep-link (#fragment) load: the browser has already native-jumped the
    // article body to the heading. Deferred one frame so the jump and first
    // layout have settled — then highlight that section immediately (instead
    // of waiting for the first observer pass) and make the entry visible
    // inside the TOC's own scrollable list (never the page itself, which
    // would fight the native jump).
    const raf = requestAnimationFrame(() => {
      const rawHash = window.location.hash.slice(1);
      if (rawHash.length === 0) return;
      let decoded = rawHash;
      try {
        decoded = decodeURIComponent(rawHash);
      } catch {
        // Malformed percent-encoding — fall back to the raw fragment.
      }
      const target = headings.some((h) => h.id === rawHash)
        ? rawHash
        : headings.some((h) => h.id === decoded)
          ? decoded
          : null;
      if (!target) return;
      setActiveId(target);
      const list = listRef.current;
      const activeLink = list?.querySelector<HTMLAnchorElement>(
        `a[href="#${CSS.escape(target)}"]`,
      );
      if (list && activeLink) {
        const linkRect = activeLink.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        const hidden = linkRect.top < listRect.top || linkRect.bottom > listRect.bottom;
        if (hidden) {
          // Center the active entry within the list viewport.
          list.scrollTop += linkRect.top - listRect.top - list.clientHeight / 2 + linkRect.height / 2;
        }
      }
    });

    // The reading line: the last heading whose top has passed ~30% of
    // the viewport is the section the reader is currently in.
    const updateActive = (): void => {
      const line = window.innerHeight * 0.3;
      let current: string | null = null;
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
      }
      setActiveId(current);
    };

    // The reading band matches the reading line (top 30% of the viewport):
    // an IntersectionObserver callback fires exactly when a heading crosses
    // that line, which is the only moment the active section can change.
    const observer = new IntersectionObserver(updateActive, {
      rootMargin: "0px 0px -70% 0px",
      threshold: 0,
    });
    for (const el of elements) observer.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label={t("article.toc")}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gold/25 bg-card shadow-sm",
        className,
      )}
    >
      {/* Gold left rail */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gold-gradient" />

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={listId}
        title={t("article.tocToggle")}
        className="flex min-h-11 w-full items-center gap-2.5 py-2 pl-5 pr-4 text-left"
      >
        <ListOrdered aria-hidden className="h-4.5 w-4.5 shrink-0 text-primary" />
        <span className="font-heading text-[15px] font-semibold text-foreground">
          {t("article.toc")}
        </span>
        <span className="ml-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {lang === "bn" ? toBnDigits(headings.length) : headings.length}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>

      <ul
        ref={listRef}
        id={listId}
        hidden={!open}
        className="scrollbar-thin max-h-[22rem] overflow-y-auto py-1.5 pl-5 pr-4"
      >
        {headings.map((heading) => {
          const active = activeId === heading.id;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "group flex min-h-9 items-center gap-2.5 rounded-lg py-1.5 pr-2 text-[13px] leading-snug transition-colors",
                  heading.level === 3 ? "pl-5" : "pl-1",
                  active
                    ? "font-semibold text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rotate-45 transition-colors",
                    active ? "bg-gold" : "bg-transparent group-hover:bg-gold/50",
                  )}
                />
                <span className="min-w-0">{heading.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
