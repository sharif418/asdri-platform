"use client";

import { CalendarDays, Download, ExternalLink, FileText, Share2 } from "lucide-react";
import Link from "next/link";
import { pick, type Language, type LocalizedText, type NoticeCategory, type NoticeStatus } from "@/types";
import { formatDate } from "@/lib/format";
import { langPath } from "@/lib/locale";
import { richTextToPlain } from "@/lib/sanitize";
import { toast } from "@/hooks/use-toast";
import { categoryLabel, statusBadgeClass, statusLabel } from "@/lib/notice-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/shared/print-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Fully serialized notice (all fields, incl. body) used by dialogs. */
export interface NoticeDetailData {
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  body: LocalizedText;
  category: NoticeCategory;
  status: NoticeStatus;
  attachmentUrl: string | null;
  publishedAt: string;
}

// Label helpers moved to the pure module (server pages call them too);
// re-exported here so existing client importers keep working.
export { categoryLabel, statusBadgeClass, statusLabel } from "@/lib/notice-labels";

interface NoticeDialogViewProps {
  notice: NoticeDetailData;
  lang: Language;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The shared notice detail dialog (used by cards and the ?notice= deep-link). */
export function NoticeDialogView({ notice, lang, open, onOpenChange }: NoticeDialogViewProps) {
  const paragraphs = richTextToPlain(pick(notice.body, lang))
    .split(/\n{1,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  /** Share the notice's permalink — Web Share on mobile, clipboard otherwise. */
  async function shareNotice() {
    const url = `${window.location.origin}${langPath(lang, `/notices/${encodeURIComponent(notice.slug)}`)}`;
    const text = `${pick(notice.title, lang)}\n${formatDate(notice.publishedAt, lang)}\n${url}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: lang === "bn" ? "বিজ্ঞপ্তি" : "Notice",
          text,
        });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast({ title: lang === "bn" ? "লিংক কপি হয়েছে" : "Link copied" });
    } catch {
      // dismissed — nothing to report
    }
  }

  /** Print the open notice as an official pad (Save-as-PDF) — PrintButton. */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden border-gold/25 sm:max-w-xl">
        {/* Gold top rule — echoes the site's emerald-band gold edge */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold-gradient" />

        <div className="print-zone">
          {/* print-only official masthead */}
          <header className="hidden print:mb-5 print:block print:border-b-2 print:border-black print:pb-3 print:text-center">
            <p className="font-heading text-lg font-bold">
              {lang === "bn" ? "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট" : "As-Sunnah Dawah & Research Institute"}
            </p>
            <p className="mt-1 text-sm">
              {lang === "bn" ? "দাপ্তরিক বিজ্ঞপ্তি" : "Official Notice"} — {categoryLabel(notice.category, lang)}
            </p>
          </header>

          <DialogHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 print:justify-center">
              <Badge variant="outline" className={cn("text-[11px] font-semibold", statusBadgeClass(notice.status))}>
                {statusLabel(notice.status, lang)}
              </Badge>
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[11px] font-semibold text-primary dark:text-gold">
                <FileText aria-hidden className="mr-1 h-3 w-3" />
                {categoryLabel(notice.category, lang)}
              </Badge>
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground print:ml-0">
                <CalendarDays aria-hidden className="h-3.5 w-3.5 text-gold" />
                {formatDate(notice.publishedAt, lang)}
              </span>
            </div>
            <DialogTitle className="text-left font-heading text-lg leading-snug sm:text-xl">
              {pick(notice.title, lang)}
            </DialogTitle>
            <DialogDescription className="text-left text-[13px] leading-relaxed print:hidden">
              {pick(notice.excerpt, lang)}
            </DialogDescription>
          </DialogHeader>

          <div className="scrollbar-thin relative max-h-[46vh] space-y-3 overflow-y-auto rounded-xl border border-l-4 border-l-gold bg-parchment/60 p-5 text-sm leading-[1.75] text-foreground/90 shadow-[inset_0_1px_4px_rgba(28,66,49,0.06)] dark:bg-muted/40 dark:shadow-[inset_0_1px_4px_rgba(0,0,0,0.25)] print:max-h-none print:rounded-none print:shadow-none">
            <span
              aria-hidden
              dir="rtl" lang="ar" className="pointer-events-none absolute -right-2 -top-2 select-none font-arabic text-7xl leading-none text-primary/5 dark:text-gold/5 print:hidden"
            >
              بِسْمِ
            </span>
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p key={index} className={index === 0 ? "font-medium text-foreground" : undefined}>
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="font-medium text-foreground">{pick(notice.excerpt, lang)}</p>
            )}
          </div>

          {/* print-only reference footer */}
          <p className="hidden print:mt-4 print:flex print:justify-between print:text-xs print:text-black">
            <span>Ref: {notice.slug}</span>
            <span>
              {lang === "bn" ? "ইস্যু" : "Issued"}: {formatDate(notice.publishedAt, lang)}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-2 print:hidden sm:flex-row">
          {notice.attachmentUrl ? (
            <Button asChild className="flex-1 gap-2 bg-gold-gradient font-bold text-gold-foreground hover:opacity-90">
              <a href={notice.attachmentUrl} download>
                <Download aria-hidden className="h-4 w-4" />
                {lang === "bn" ? "সংযুক্ত ফাইল" : "Attachment"}
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => void shareNotice()}
            variant="outline"
            className="gap-2 border-gold/40 font-semibold hover:bg-gold-soft sm:flex-none"
          >
            <Share2 aria-hidden className="h-4 w-4" />
            {lang === "bn" ? "শেয়ার" : "Share"}
          </Button>
          <PrintButton
            bodyClass="printing-notice"
            label={lang === "bn" ? "অফিসিয়াল কপি (PDF)" : "Official copy (PDF)"}
            className="gap-2 bg-primary font-semibold text-primary-foreground hover:bg-primary/90 sm:flex-none"
          />
        </div>

        {/* Permalink — the shareable, crawlable full page for this notice. */}
        <div className="print:hidden">
          <Link
            href={langPath(lang, `/notices/${notice.slug}`)}
            className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold dark:hover:text-gold"
          >
            <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            {lang === "bn" ? "সম্পূর্ণ পাতা খুলুন" : "Open the full page"}
          </Link>
        </div>

        {!notice.attachmentUrl ? (
          <p className="text-xs text-muted-foreground print:hidden">
            {lang === "bn"
              ? "এই বিজ্ঞপ্তির কোনো সংযুক্ত ফাইল নেই। বিস্তারিত জানতে অফিসে যোগাযোগ করুন।"
              : "No attachment for this notice. Contact the office for details."}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
