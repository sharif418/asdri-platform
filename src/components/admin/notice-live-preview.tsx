"use client";

import { Bell, Briefcase, CalendarDays, Download, FileText, GraduationCap, Megaphone } from "lucide-react";
import { adminCategoryLabel, adminStatusBadgeClass, adminStatusLabel } from "@/components/admin/admin-types";
import type { NoticeFormValues } from "@/components/admin/admin-types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Language, NoticeCategory } from "@/types";

const CATEGORY_ICONS: Record<NoticeCategory, typeof Bell> = {
  admission: GraduationCap,
  recruitment: Briefcase,
  academic: FileText,
  general: Megaphone,
};

interface NoticeLivePreviewProps {
  values: NoticeFormValues;
  lang: Language;
}

/** Bengali live preview styled like the public /notices board card. */
export function NoticeLivePreview({ values, lang }: NoticeLivePreviewProps) {
  const bn = lang === "bn";
  const Icon = CATEGORY_ICONS[values.category];
  const title = values.titleBn.trim() || (bn ? "শিরোনাম এখানে দেখাবে…" : "Title preview…");
  const excerpt = values.excerptBn.trim() || (bn ? "সারসংক্ষেপ এখানে দেখাবে…" : "Excerpt preview…");
  const paragraphs = values.bodyBn
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <div className="sticky top-6 space-y-3">
      <div className="flex items-center gap-2">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
        <h2 className="font-heading text-[15px] font-bold">{bn ? "লাইভ প্রিভিউ" : "Live Preview"}</h2>
        <span className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">{bn ? "বাংলা" : "Bengali"}</span>
      </div>

      <article className="overflow-hidden rounded-2xl border bg-card shadow-sm" aria-label={bn ? "নোটিশ প্রিভিউ" : "Notice preview"}>
        <div aria-hidden className="h-1 bg-gold-gradient" />
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn("text-[10px] font-semibold", adminStatusBadgeClass(values.status))}>
                  {adminStatusLabel(values.status, lang)}
                </Badge>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {adminCategoryLabel(values.category, lang)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                  <CalendarDays aria-hidden className="h-3.5 w-3.5 text-gold" />
                  {formatDate(new Date(), lang)}
                </span>
              </div>

              <h3 className="font-heading mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug sm:text-base">
                {title}
              </h3>
              <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{excerpt}</p>
            </div>
          </div>

          {paragraphs.length > 0 ? (
            <div className="mt-4 max-h-44 space-y-2 overflow-hidden rounded-xl bg-parchment/60 p-3.5 text-[12.5px] leading-relaxed text-foreground/90 dark:bg-muted/40 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
              {paragraphs.slice(0, 4).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-dashed pt-3">
            <span className="text-[11px] text-muted-foreground">
              {values.slug.trim() ? (
                <>
                  <span className="font-mono">/{values.slug.trim()}</span>
                </>
              ) : (
                (bn ? "স্লাগ: স্বয়ংক্রিয়ভাবে তৈরি হবে" : "Slug: auto-generated")
              )}
            </span>
            {values.attachmentUrl.trim() ? (
              <Badge variant="outline" className="gap-1 border-gold/40 bg-gold/10 text-[10px] font-semibold text-gold">
                <Download aria-hidden className="h-3 w-3" />
                {bn ? "সংযুক্ত ফাইল" : "Attachment"}
              </Badge>
            ) : null}
          </div>
        </div>
      </article>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {bn
          ? "সংরক্ষণের পর এই কার্ডটি প্রকাশ্য নোটিশ বোর্ডে (বাংলা মোডে) ঠিক এভাবেই দেখাবে ইনশাআল্লাহ।"
          : "After saving, this card renders exactly like this on the public notice board (Bengali mode)."}
      </p>
    </div>
  );
}
