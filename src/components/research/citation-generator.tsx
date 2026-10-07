"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "@/hooks/use-toast";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import type { Language, LocalizedText } from "@/types";

type CitationStyle = "apa" | "chicago" | "mla";

const PUBLISHER = "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট, ঢাকা";

export interface CitationGeneratorProps {
  title: LocalizedText;
  author: string;
  year: number | string | null;
  lang: Language;
  /** Publisher name; falls back to the institute (journal cards' behaviour). */
  publisher?: string | null;
  /** Place of publication, e.g. "ঢাকা" — Chicago prefixes it to the publisher. */
  place?: string | null;
  /** Edition note (e.g. "২য় সংস্করণ") appended to the title. */
  edition?: string | null;
  /** Journal name + volume/issue for periodical citations. */
  journal?: { name: string; volume?: string | null; issue?: string | null } | null;
}

/** Join citation fragments with terminal punctuation, skipping empties. */
function joinFragments(parts: (string | null | undefined)[]): string {
  return parts
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

/**
 * One-click citation generator — renders APA 7 / Chicago / MLA 9 strings
 * and copies the selected format to the clipboard. Shared by the journal
 * cards (title/author/year only) and the library record page (which adds
 * publisher, place, edition and journal volume/issue).
 */
export function CitationGenerator({
  title,
  author,
  year,
  lang,
  publisher,
  place,
  edition,
  journal,
}: CitationGeneratorProps) {
  const { t } = useLanguage();
  const [style, setStyle] = useState<CitationStyle>("apa");
  const [copied, setCopied] = useState(false);

  const resolvedTitle = pick(title, lang);
  const yearText = year != null && year !== "" ? (lang === "bn" ? toBnDigits(year) : String(year)) : lang === "bn" ? "তারিখবিহীন" : "n.d.";
  const publisherText = (publisher ?? "").trim() || PUBLISHER;
  const placeText = (place ?? "").trim();
  const editionText = (edition ?? "").trim();
  const titleWithEdition = joinFragments([resolvedTitle, editionText ? `(${editionText})` : null]);
  const journalFragment = journal?.name
    ? joinFragments([journal.name, journal.volume ? `${journal.volume}${journal.issue ? `(${journal.issue})` : ""}` : null])
    : null;

  const citations = useMemo(() => {
    const imprint = placeText ? `${placeText}: ${publisherText}` : publisherText;
    return {
      apa: joinFragments([
        `${author}.`,
        `(${yearText}).`,
        `${titleWithEdition}.`,
        journalFragment ? `*${journalFragment}*.` : null,
        `${imprint}.`,
      ]),
      chicago: joinFragments([
        `${author}.`,
        `*${titleWithEdition}*.`,
        journalFragment ? `*${journalFragment}*,` : null,
        `${imprint},`,
        `${yearText}.`,
      ]),
      mla: joinFragments([
        `${author}.`,
        `*${titleWithEdition}*.`,
        journalFragment ? `*${journalFragment}*,` : null,
        `${publisherText},`,
        `${yearText}.`,
      ]),
    };
  }, [author, yearText, titleWithEdition, journalFragment, placeText, publisherText]);

  async function copyCitation() {
    const text = citations[style].replace(/\*/g, "");
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

  const renderCitation = () => {
    const text = citations[style];
    // emphasise title (+ journal) with real <em> — the copied string strips *
    const emphasised = text
      .split("*")
      .map((chunk, index) => (index % 2 === 1 ? <em key={index}>{chunk}</em> : <span key={index}>{chunk}</span>));
    return <>{emphasised}</>;
  };

  return (
    <div className="rounded-xl border border-dashed border-gold/40 bg-parchment p-4 dark:bg-secondary/40">
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

      <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/90">{renderCitation()}</p>

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
