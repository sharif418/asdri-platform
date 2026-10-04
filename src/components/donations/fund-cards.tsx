"use client";

import { Check, Gift, GraduationCap, HandCoins, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FundType, Language, LocalizedText } from "@/types";
import { pick } from "@/types";
import { cn } from "@/lib/utils";

interface FundCardsProps {
  selected: FundType;
  onSelect: (fund: FundType) => void;
  lang: Language;
}

interface FundOption {
  id: FundType;
  icon: LucideIcon;
  title: LocalizedText;
  description: LocalizedText;
  note: LocalizedText;
}

const fundOptions: FundOption[] = [
  {
    id: "zakat",
    icon: HandCoins,
    title: { bn: "যাকাত ফান্ড", en: "Zakat Fund" },
    description: {
      bn: "শতভাগ যাকাত পাওয়ার যোগ্য অস্বচ্ছল শিক্ষার্থীদের ফ্রি শিক্ষা, আবাসন ও খাবারে ব্যয় হয়।",
      en: "Spent entirely on zakat-eligible students' free education, housing, and meals.",
    },
    note: { bn: "শতভাগ যাকাত-যোগ্য খাত", en: "100% zakat-eligible" },
  },
  {
    id: "sponsor",
    icon: GraduationCap,
    title: { bn: "শিক্ষার্থী স্পন্সর", en: "Sponsor a Student" },
    description: {
      bn: "গোপনীয়তা-সংরক্ষিত তালিকা থেকে নির্দিষ্ট শিক্ষার্থীর পুরো বছর বা মাসের দায়িত্ব নিন।",
      en: "Take on a specific student's annual or monthly cost from the privacy-protected list.",
    },
    note: { bn: "সেমিস্টারভিত্তিক প্রগতি রিপোর্ট", en: "Semesterly progress reports" },
  },
  {
    id: "general",
    icon: Gift,
    title: { bn: "সাধারণ অনুদান", en: "General Donation" },
    description: {
      bn: "ইনস্টিটিউটের উন্নয়ন, লাইব্রেরি, প্রযুক্তি খাত ও পরিচালন ব্যয়ে অবদান রাখুন।",
      en: "Contribute to institute development, library, technology, and operating costs.",
    },
    note: { bn: "সাদাকায়ে জারিয়া", en: "Ongoing charity (sadaqah jariyah)" },
  },
  {
    id: "scholarship",
    icon: Sparkles,
    title: { bn: "স্কলারশিপ ফান্ড", en: "Scholarship Fund" },
    description: {
      bn: "মেধাবী শিক্ষার্থীদের এককালীন বা মাসিক বৃত্তি প্রদানের জন্য নিবেদিত ফান্ড।",
      en: "A dedicated fund for one-time or monthly scholarships for talented students.",
    },
    note: { bn: "মেধাবীদের জন্য নিবেদিত", en: "For talented students" },
  },
];

/** Selectable fund category cards that drive the donation form state. */
export function FundCards({ selected, onSelect, lang }: FundCardsProps) {
  return (
    <div
      role="radiogroup"
      aria-label={lang === "bn" ? "ফান্ড নির্বাচন করুন" : "Choose a fund"}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {fundOptions.map((fund) => {
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
