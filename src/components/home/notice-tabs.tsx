"use client";

import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { feedTabs, type FeedTab, type OfferedTab } from "@/content/home-islands";
import { toBnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Per-tab notice counts (server-computed, shown as small badges). */
export type TabCounts = Partial<Record<OfferedTab, number>>;

/** How many cards each tab shows (mirrors the server curation constant). */
const MAX_SHOWN = 6;

/**
 * Instant notice-category tabs. The cards themselves are server-rendered
 * ONCE (src/components/home/notices-feed.tsx) — every <li> carries its
 * category, global rank and within-category rank; this island only flips
 * `hidden`, so switching tabs costs zero network round-trips and zero
 * duplicated markup. Without JS the default curated "all" view stays.
 */
export function NoticeTabs({ lang, counts = {} }: { lang: "bn" | "en"; counts?: TabCounts }) {
  const { t } = useLanguage();
  const [active, setActive] = useState<FeedTab>("all");

  function select(tab: FeedTab) {
    setActive(tab);
    const host = document.getElementById("home-notices");
    if (!host) return;
    host.dataset.activeTab = tab;
    host.querySelectorAll<HTMLElement>("#home-notice-list > li").forEach((card) => {
      const rank = Number(card.dataset.rank ?? "0");
      const categoryRank = Number(card.dataset.categoryRank ?? "0");
      const category = card.dataset.category ?? "general";
      const visible = tab === "all" ? rank < MAX_SHOWN : category === tab && categoryRank < MAX_SHOWN;
      card.hidden = !visible;
    });
  }

  return (
    <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label={t("label.category")}>
      {feedTabs.map((tab) => {
        const count = counts[tab.id] ?? 0;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`notice-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls="home-notice-list"
            onClick={() => select(tab.id)}
            className={cn(
              "rounded-full px-4 py-2 text-[13px] font-medium transition-all outline-none",
              "focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active === tab.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {t(tab.key as Parameters<typeof t>[0])}
            {count > 0 ? (
              <span
                className={cn(
                  "ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                  active === tab.id ? "bg-white/25 text-primary-foreground" : "bg-primary/10 text-primary",
                )}
              >
                {lang === "bn" ? toBnDigits(count) : count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
