"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "@/hooks/use-toast";
import { pick } from "@/types";
import type { Language, LocalizedText } from "@/types";

type CitationStyle = "apa" | "chicago" | "mla";

const PUBLISHER = "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট, ঢাকা";

interface CitationGeneratorProps {
  title: LocalizedText;
  author: string;
  year: number;
  lang: Language;
}

/**
 * One-click citation generator — renders APA 7 / Chicago / MLA 9 strings
 * and copies the selected format to the clipboard.
 */
export function CitationGenerator({ title, author, year, lang }: CitationGeneratorProps) {
  const { t } = useLanguage();
  const [style, setStyle] = useState<CitationStyle>("apa");
  const [copied, setCopied] = useState(false);

  const resolvedTitle = pick(title, lang);

  const citations = useMemo(
    () => ({
      apa: `${author}. (${year}). ${resolvedTitle}. ${PUBLISHER}.`,
      chicago: `${author}. ${resolvedTitle}. ${year}.`,
      mla: `${author}. ${resolvedTitle}. ${year}.`,
    }),
    [author, resolvedTitle, year],
  );

  async function copyCitation() {
    const text = citations[style];
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: t("action.copied"), description: text });
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  }

  const styleOptions: { value: CitationStyle; label: string }[] = [
    { value: "apa", label: "APA 7" },
    { value: "chicago", label: "Chicago" },
    { value: "mla", label: "MLA 9" },
  ];

  return (
    <div className="rounded-xl border border-dashed bg-parchment p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Quote aria-hidden className="h-3.5 w-3.5 text-gold" />
          {lang === "bn" ? "সাইটেশন জেনারেটর" : "Citation Generator"}
        </p>
        <div
          role="group"
          aria-label={lang === "bn" ? "সাইটেশন স্টাইল" : "Citation style"}
          className="flex gap-1"
        >
          {styleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStyle(option.value)}
              aria-pressed={style === option.value}
              className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold tracking-wide transition-colors ${
                style === option.value
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/90">
        {style === "apa" ? (
          <>
            {author}. ({year}). <em>{resolvedTitle}</em>. {PUBLISHER}.
          </>
        ) : (
          <>
            {author}. <em>{resolvedTitle}</em>. {year}.
          </>
        )}
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={copyCitation}
        className="mt-3 h-8 gap-1.5 border-gold/50 px-3.5 text-[12px] font-semibold text-gold hover:bg-gold hover:text-gold-foreground"
      >
        {copied ? (
          <>
            <Check aria-hidden className="h-3.5 w-3.5" />
            {t("action.copied")}
          </>
        ) : (
          <>
            <Copy aria-hidden className="h-3.5 w-3.5" />
            {t("action.copy")}
          </>
        )}
      </Button>
    </div>
  );
}
