"use client";

import { Check, Gift, GraduationCap, HandCoins, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FundView } from "@/lib/content/funds";
import type { FundType, Language, LocalizedText } from "@/types";
import { pick } from "@/types";
import { cn } from "@/lib/utils";

interface FundCardsProps {
  selected: FundType;
  onSelect: (fund: FundType) => void;
  lang: Language;
  /** DB-driven fund rows (key/title/description). */
  funds: FundView[];
}

interface FundOption {
  id: FundType;
  icon: LucideIcon;
  title: LocalizedText;
  description: LocalizedText;
  note: LocalizedText;
}

/** Chrome (icon + note) for each known fund key. */
const FUND_CHROME: Record<FundType, { icon: LucideIcon; note: LocalizedText }> = {
  zakat: {
    icon: HandCoins,
    note: { bn: "শতভাগ যাকাত-যোগ্য খাত", en: "100% zakat-eligible" },
  },
  sponsor: {
    icon: GraduationCap,
    note: { bn: "সেমিস্টারভিত্তিক প্রগতি রিপোর্ট", en: "Semesterly progress reports" },
  },
  general: {
    icon: Gift,
    note: { bn: "সাদাকায়ে জারিয়া", en: "Ongoing charity (sadaqah jariyah)" },
  },
  scholarship: {
    icon: Sparkles,
    note: { bn: "মেধাবীদের জন্য নিবেদিত", en: "For talented students" },
  },
};

/** Selectable fund category cards that drive the donation form state. */
export function FundCards({ selected, onSelect, lang, funds }: FundCardsProps) {
  const options: FundOption[] = funds.map((fund) => {
    const chrome = FUND_CHROME[fund.key];
    return { id: fund.key, icon: chrome.icon, title: fund.title, description: fund.description, note: chrome.note };
  });
  return (
    <div
      role="radiogroup"
      aria-label={lang === "bn" ? "ফান্ড নির্বাচন করুন" : "Choose a fund"}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {options.map((fund) => {
        const Icon = fund.icon;
        const isSelected = selected === fund.id;
        return (
          <button
            key={fund.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(fund.id)}
            className={cn(
              "group relative flex h-full flex-col rounded-xl border bg-card p-5 text-left shadow-sm transition-all",
              "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
              isSelected
                ? "border-gold/70 ring-2 ring-gold/40 shadow-md"
                : "border-border hover:border-gold/50",
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-lg transition-colors",
                isSelected ? "bg-gold text-gold-foreground" : "bg-primary/10 text-primary",
              )}
            >
              <Icon aria-hidden className="h-5.5 w-5.5" />
            </span>

            <span className="font-heading mt-4 text-[15px] font-semibold leading-snug">
              {pick(fund.title, lang)}
            </span>
            <span className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-muted-foreground">
              {pick(fund.description, lang)}
            </span>

            <span className="mt-3 inline-flex w-fit items-center rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[10.5px] font-semibold text-gold">
              {pick(fund.note, lang)}
            </span>

            {isSelected ? (
              <span
                aria-hidden
                className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-gold-foreground shadow"
              >
                <Check className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
