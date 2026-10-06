import Link from "next/link";
import { ArrowRight, BookMarked, BookOpen } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { FatwaAskForm } from "@/components/home/fatwa-ask-form";
import { FatwaBankSearch } from "@/components/home/fatwa-bank-search";
import { Badge } from "@/components/ui/badge";
import { listFatwaPreview, type FatwaPreviewItem } from "@/lib/content/fatwa";
import { fatwaCategoryOptions } from "@/content/home-islands";
import { formatDate } from "@/lib/format";
import { langPath } from "@/lib/locale";
import type { Language } from "@/types";

/** One fatwa bank entry (server-rendered). data-search powers the island filter. */
function FatwaBankEntry({ entry, lang }: { entry: FatwaPreviewItem; lang: Language }) {
  const cat = fatwaCategoryOptions.find((c) => c.value === entry.category);
  const question = lang === "bn" ? entry.question.bn : entry.question.en;
  const answer = lang === "bn" ? entry.answer.bn : entry.answer.en;
  return (
    <li
      data-search={`${question} ${answer} ${entry.answeredBy}`.toLowerCase()}
      className="rounded-xl border bg-background/60 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="border-gold/40 bg-gold/10 text-[10px] font-semibold text-gold">
          {cat ? (lang === "bn" ? cat.labelBn : cat.labelEn) : entry.category}
        </Badge>
        <span className="text-[11px] text-muted-foreground">{formatDate(entry.publishedAt, lang)}</span>
      </div>
      <h4 className="mt-2.5 text-[14px] font-semibold leading-snug">{question}</h4>
      <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{answer}</p>
      <p className="mt-2.5 text-[11px] font-medium text-primary">— {entry.answeredBy}</p>
    </li>
  );
}

/**
 * Fatwa & online query gateway — server shell with two small islands:
 * the quick-ask form (src/components/home/fatwa-ask-form.tsx) and the bank
 * search filter (src/components/home/fatwa-bank-search.tsx).
 *
 * Round 4: was a single 324-line client island that fetched /api/fatwa after
 * hydration — the bank now ships in the document (crawlers see it), the form
 * is the only stateful JS, and nothing from this section is serialized into
 * the RSC flight payload.
 */
export async function FatwaGateway({ lang }: { lang: Language }) {
  const entries = await listFatwaPreview(4);

  return (
    <section className="py-16 sm:py-24">
      <div className="container-site">
        <Reveal>
          <SectionHeading
            eyebrow={lang === "bn" ? "ফতোয়া ও জিজ্ঞাসা" : "Fatwa & Queries"}
            title={lang === "bn" ? "একাডেমিক অনলাইন জিজ্ঞাসা" : "Online Query Gateway"}
            description={
              lang === "bn"
                ? "দৈনন্দিন ফিকহ ও সমকালীন বিষয়ে প্রশ্ন করুন — ইনস্টিটিউটের ফিকহ ও গবেষণা বোর্ড থেকে পান প্রামাণ্য লিখিত উত্তর।"
                : "Ask everyday fiqh and contemporary questions — receive authentic written answers from the institute's fiqh & research board."
            }
            lang={lang}
          />
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Quick ask form — the interactive island */}
          <Reveal>
            <FatwaAskForm lang={lang} />
          </Reveal>

          {/* Searchable fatwa bank preview — server-rendered, island-filtered */}
          <Reveal delay={0.12}>
            <div className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
              <h3 className="font-heading flex items-center gap-2.5 text-lg font-semibold">
                <BookMarked aria-hidden className="h-5 w-5 text-gold" />
                {lang === "bn" ? "সার্চেবল ফতোয়া ব্যাংক" : "Searchable Fatwa Bank"}
              </h3>

              <FatwaBankSearch lang={lang} />

              <div className="mt-5 flex-1">
                {entries.length === 0 ? (
                  <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    <BookOpen aria-hidden className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                    {lang === "bn" ? "এখনো কোনো ফতোয়া প্রকাশিত হয়নি।" : "No fatwas published yet."}
                  </p>
                ) : (
                  <ul id="fatwa-bank-list" className="scrollbar-thin max-h-[420px] space-y-4 overflow-y-auto pr-1">
                    {entries.map((entry) => (
                      <FatwaBankEntry key={entry.id} entry={entry} lang={lang} />
                    ))}
                  </ul>
                )}
                <p id="fatwa-bank-empty" hidden className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <BookOpen aria-hidden className="mx-auto mb-2 h-7 w-7 text-muted-foreground/50" />
                  {lang === "bn" ? "কোনো ফতোয়া মেলেনি।" : "No matching fatwas."}
                </p>
              </div>

              <Link
                href={langPath(lang, "/research/fatwa")}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {lang === "bn" ? "সম্পূর্ণ ফতোয়া ব্যাংক" : "Full Fatwa Bank"}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
