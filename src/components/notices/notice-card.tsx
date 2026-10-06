"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Briefcase, CalendarDays, ChevronRight, FileText, GraduationCap, Megaphone, Pin } from "lucide-react";
import { pick, type Language, type NoticeCategory } from "@/types";
import { daysAgoLabel, formatDate } from "@/lib/format";
import { langPath } from "@/lib/locale";
import { Badge } from "@/components/ui/badge";
import {
  NoticeDialogView,
  categoryLabel,
  statusBadgeClass,
  statusLabel,
  type NoticeDetailData,
} from "@/components/notices/notice-dialog";

const CATEGORY_ICONS: Record<NoticeCategory, typeof Bell> = {
  admission: GraduationCap,
  recruitment: Briefcase,
  academic: FileText,
  general: Megaphone,
};

/** Category-tinted left accent classes for board rows — per-category identity. */
const CATEGORY_ACCENT: Record<NoticeCategory, string> = {
  admission: "bg-gold/70",
  recruitment: "bg-emerald-500/70",
  academic: "bg-primary/70",
  general: "bg-amber-400/70",
};

interface NoticeCardProps {
  notice: NoticeDetailData;
  lang: Language;
  /** Editorial pin — gold wash + pin badge (pinned group on the board). */
  pinned?: boolean;
}

/** Board row: category icon, status/category badges, excerpt, date + detail dialog. */
export function NoticeCard({ notice, lang, pinned = false }: NoticeCardProps) {
  const [open, setOpen] = useState(false);
  const Icon = CATEGORY_ICONS[notice.category];

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/10 sm:p-5 ${
        pinned ? "border-gold/40 bg-gold/5 hover:border-gold/70" : "hover:border-gold/50"
      }`}
    >
      {/* Category accent strip — survives the generic hover border change */}
      <span
        aria-hidden
        className={`absolute inset-y-2 left-0 w-1 rounded-full transition-all duration-300 group-hover:inset-y-1 ${
          pinned ? "bg-gold" : CATEGORY_ACCENT[notice.category]
        }`}
      />
      <div className="flex items-start gap-4">
        <div
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {pinned ? (
              <Badge variant="outline" className="gap-1 border-gold/40 bg-gold/15 text-[10px] font-semibold text-[#7a5c15] dark:text-gold">
                <Pin aria-hidden className="h-3 w-3" />
                {lang === "bn" ? "পিন করা" : "Pinned"}
              </Badge>
            ) : null}
            <Badge variant="outline" className={`text-[10px] font-semibold ${statusBadgeClass(notice.status)}`}>
              {statusLabel(notice.status, lang)}
            </Badge>
            <span className="text-[11px] font-medium text-muted-foreground">
              {categoryLabel(notice.category, lang)}
            </span>
            <span className="text-[11px] text-muted-foreground/70">· {daysAgoLabel(notice.publishedAt, lang)}</span>
          </div>

          <h3 className="mt-1.5 font-heading text-[15px] font-semibold leading-snug sm:text-base">
            {/* Real permalink — crawlable, middle-click/new-tab friendly; the
                Details button below keeps the instant quick-view dialog. */}
            <Link
              href={langPath(lang, `/notices/${notice.slug}`)}
              className="decoration-gold/50 decoration-2 underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold dark:hover:text-gold"
            >
              {pick(notice.title, lang)}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {pick(notice.excerpt, lang)}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <CalendarDays aria-hidden className="h-3.5 w-3.5 text-gold" />
              {formatDate(notice.publishedAt, lang)}
            </span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              className="link-sweep inline-flex items-center gap-1 text-[13px] font-bold text-primary transition-colors hover:text-primary/80 dark:text-gold"
            >
              {lang === "bn" ? "বিস্তারিত" : "Details"}
              <ChevronRight aria-hidden className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <NoticeDialogView notice={notice} lang={lang} open={open} onOpenChange={setOpen} />
    </article>
  );
}
