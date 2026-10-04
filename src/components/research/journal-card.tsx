import { CalendarDays, Hash, LibraryBig, PenLine } from "lucide-react";
import { CitationGenerator } from "@/components/research/citation-generator";
import { ReaderDialog } from "@/components/research/reader-dialog";
import { toBnDigits } from "@/lib/format";
import { pick } from "@/types";
import type { Language, PublicationItem } from "@/types";

/**
 * A library catalog card for a journal/periodical — metadata
 * (editor, date, ISSN), citation generator, and the PDF reader.
 */
export function JournalCard({ item, lang }: { item: PublicationItem; lang: Language }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md">
      {/* spine header */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${item.accentClass} p-5 text-ivory`}>
        <div aria-hidden className="pattern-lattice-light absolute inset-0" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
              {lang === "bn" ? "জার্নাল / পত্রিকা" : "Journal / Periodical"}
            </p>
            <h3 className="font-heading mt-1.5 text-base font-semibold leading-snug sm:text-lg">
              {pick(item.title, lang)}
            </h3>
          </div>
          <LibraryBig aria-hidden className="h-6 w-6 shrink-0 text-gold/80" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{pick(item.description, lang)}</p>

        {/* metadata */}
        <dl className="mt-5 grid gap-2.5 rounded-xl bg-parchment p-4 text-[12.5px]">
          <div className="flex items-center gap-2.5">
            <PenLine aria-hidden className="h-3.5 w-3.5 shrink-0 text-gold" />
            <dt className="sr-only">{lang === "bn" ? "লেখক / সম্পাদক" : "Author / Editor"}</dt>
            <dd>
              <span className="font-semibold">{lang === "bn" ? "সম্পাদনা: " : "Edited by: "}</span>
              {item.author}
            </dd>
          </div>
          <div className="flex items-center gap-2.5">
            <CalendarDays aria-hidden className="h-3.5 w-3.5 shrink-0 text-gold" />
            <dt className="sr-only">{lang === "bn" ? "প্রকাশকাল" : "Publication date"}</dt>
            <dd>
              <span className="font-semibold">{lang === "bn" ? "প্রকাশকাল: " : "Published: "}</span>
              {lang === "bn" ? toBnDigits(item.year) : String(item.year)}
            </dd>
          </div>
          <div className="flex items-center gap-2.5">
            <Hash aria-hidden className="h-3.5 w-3.5 shrink-0 text-gold" />
            <dt className="sr-only">ISSN / ISBN</dt>
            <dd>
              <span className="font-semibold">ISSN: </span>
              {item.issnIsbn ?? (lang === "bn" ? "নিবন্ধন প্রক্রিয়াধীন" : "Registration pending")}
            </dd>
          </div>
        </dl>

        {/* citation generator */}
        <div className="mt-5">
          <CitationGenerator title={item.title} author={item.author} year={item.year} lang={lang} />
        </div>

        {/* reader */}
        <div className="mt-5 flex-1" />
        <div className="flex flex-wrap items-center gap-2.5">
          <ReaderDialog title={item.title} issnIsbn={item.issnIsbn} year={item.year} lang={lang} />
        </div>
      </div>
    </article>
  );
}
