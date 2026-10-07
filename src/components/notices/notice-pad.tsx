import { CalendarDays, FileText, Pin } from "lucide-react";
import type { Lang } from "@/lib/locale";
import type { NoticeDetailRecord } from "@/lib/content/notices";
import { pick } from "@/types";
import { formatDate } from "@/lib/format";
import { sanitizeRichText } from "@/lib/sanitize";
import { PrintMasthead } from "@/components/shared/print-masthead";
import { brand } from "@/lib/brand";
import { categoryLabel, statusBadgeClass, statusLabel } from "@/lib/notice-labels";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * The official notice pad — the gold-edged parchment every notice detail view
 * renders: the board's quick-look dialog echoes it, the public permalink page
 * builds on it, and the signed /preview route renders drafts through it so a
 * pre-publish preview is pixel-identical to the published page.
 */
export function NoticePad({ notice, lang }: { notice: NoticeDetailRecord; lang: Lang }) {
  const bn = lang === "bn";
  const bodyHtml = sanitizeRichText(pick(notice.body, lang));
  const excerptText = pick(notice.excerpt, lang).trim();

  return (
    <>
      {/* sr-only section heading keeps the document outline sequential
          (h1 hero → h2 pad → h2 neighbours → footer h3) for screen
          readers and axe — the pad itself is untitled prose by design. */}
      <h2 className="sr-only">{bn ? "বিজ্ঞপ্তির বিস্তারিত" : "Notice details"}</h2>
      <article className="print-zone relative overflow-hidden rounded-2xl border border-gold/25 bg-card shadow-sm">
        <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold-gradient" />

        {/* print-only official masthead — the mono-emerald mark beside the institute name */}
        <PrintMasthead
          name={bn ? brand.nameBn : brand.nameEn}
          title={`${bn ? "দাপ্তরিক বিজ্ঞপ্তি" : "Official Notice"} — ${categoryLabel(notice.category, lang)}`}
        />

        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 print:justify-center">
            {notice.pinned ? (
              <Badge variant="outline" className="gap-1 border-gold/40 bg-gold/15 text-[11px] font-semibold text-[#7a5c15] dark:text-gold">
                <Pin aria-hidden className="h-3 w-3" />
                {bn ? "পিন করা" : "Pinned"}
              </Badge>
            ) : null}
            <Badge variant="outline" className={cn("text-[11px] font-semibold", statusBadgeClass(notice.status))}>
              {statusLabel(notice.status, lang)}
            </Badge>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/5 text-[11px] font-semibold text-primary dark:text-gold"
            >
              <FileText aria-hidden className="mr-1 h-3 w-3" />
              {categoryLabel(notice.category, lang)}
            </Badge>
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums print:ml-0">
              <CalendarDays aria-hidden className="h-3.5 w-3.5 text-gold" />
              {bn ? "প্রকাশ: " : "Published: "}
              {formatDate(notice.publishedAt, lang)}
            </span>
          </div>

          <div className="prose-islamic mt-5 text-[15px] leading-[1.9] sm:text-base">
            {bodyHtml ? (
              // Stored rich HTML — written through the admin editor's strict
              // whitelist (sanitizeRichText on save) and re-sanitised here on
              // read, so only semantic tags can ever reach the DOM.
              <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            ) : (
              <p className="font-medium text-foreground">{excerptText}</p>
            )}
          </div>

          {!notice.attachmentUrl ? (
            <p className="mt-6 rounded-xl border border-dashed border-gold/30 bg-gold/5 px-4 py-3 text-xs text-muted-foreground print:hidden">
              {bn
                ? "এই বিজ্ঞপ্তির কোনো সংযুক্ত ফাইল নেই। বিস্তারিত জানতে অফিসে যোগাযোগ করুন।"
                : "No attachment for this notice. Contact the office for details."}
            </p>
          ) : null}
        </div>

        {/* print-only reference footer */}
        <p className="hidden print:mt-4 print:flex print:justify-between print:text-xs print:text-black">
          <span>Ref: {notice.slug}</span>
          <span>
            {bn ? "ইস্যু" : "Issued"}: {formatDate(notice.publishedAt, lang)}
          </span>
        </p>
      </article>
    </>
  );
}
