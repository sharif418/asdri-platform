"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, FileText, Megaphone, GraduationCap, Briefcase, Pin } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/providers/language-provider";
import { formatDate, daysAgoLabel } from "@/lib/format";
import { langPath } from "@/lib/locale";
import { cn } from "@/lib/utils";
import type { Language, LocalizedText, NoticeCategory } from "@/types";
import { pick } from "@/types";

/** Serialized notice returned by GET /api/notices. */
interface NoticeDto {
  id: string;
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  category: NoticeCategory;
  status: "new" | "active" | "closed";
  pinned: boolean;
  publishedAt: string;
  attachmentUrl: string | null;
}

type FeedTab = "all" | NoticeCategory;

const tabs: { id: FeedTab; key: string }[] = [
  { id: "all", key: "label.all" },
  { id: "admission", key: "notice.cat.admission" },
  { id: "academic", key: "notice.cat.academic" },
  { id: "recruitment", key: "notice.cat.recruitment" },
];

const categoryIcons: Record<NoticeCategory, typeof Bell> = {
  admission: GraduationCap,
  academic: FileText,
  recruitment: Briefcase,
  general: Megaphone,
};

function statusBadgeClass(status: NoticeDto["status"]): string {
  switch (status) {
    case "new":
      return "bg-gold/15 text-gold border-gold/40";
    case "active":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40";
    case "closed":
      return "bg-muted text-muted-foreground border-border";
  }
}

/** Editorial curation: up to 3 pinned notices first, then the latest to fill. */
const MAX_PINNED = 3;
const MAX_SHOWN = 6;

/** Recent notices — tabbed dynamic feed backed by /api/notices. */
export function NoticesFeed({ lang }: { lang: Language }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<FeedTab>("all");
  const [notices, setNotices] = useState<NoticeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notices?pageSize=12")
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        const payload: { data: { items: NoticeDto[] } } = await res.json();
        if (!cancelled) setNotices(payload.data.items);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Editorial curation: pinned notices lead the feed (max 3), latest fill the rest.
  const filtered = useMemo(() => {
    const matching = activeTab === "all" ? notices : notices.filter((n) => n.category === activeTab);
    const pinned = matching.filter((n) => n.pinned).slice(0, MAX_PINNED);
    const pinnedIds = new Set(pinned.map((n) => n.id));
    const rest = matching.filter((n) => !pinnedIds.has(n.id));
    return [...pinned, ...rest].slice(0, MAX_SHOWN);
  }, [notices, activeTab]);

  return (
    <section className="py-16 sm:py-24">
      <div className="container-site">
        <Reveal>
          <SectionHeading
            eyebrow={lang === "bn" ? "নোটিশ বোর্ড" : "Notice Board"}
            title={lang === "bn" ? "সাম্প্রতিক বিজ্ঞপ্তি ও নোটিশ" : "Recent Announcements & Notices"}
            description={
              lang === "bn"
                ? "ভর্তি, নিয়োগ, একাডেমিক ও সাধারণ — সকল দাপ্তরিক বিজ্ঞপ্তি এক জায়গায়।"
                : "Admission, recruitment, academic, and general notices — all in one place."
            }
            lang={lang}
          />
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label={t("label.category")}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-[13px] font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {t(tab.key as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mx-auto mt-8 max-w-4xl">
          {loading ? (
            <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : failed || filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              {failed ? t("toast.error") : t("label.noResults")}
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.slice(0, 6).map((notice) => {
                const Icon = categoryIcons[notice.category];
                return (
                  <li key={notice.id}>
                    <Link
                      href={langPath(lang, `/notices?notice=${notice.slug}`)}
                      className="group flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-gold/50 hover:shadow-md sm:items-center sm:p-5"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon aria-hidden className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {notice.pinned ? (
                            <Badge
                              variant="outline"
                              className="gap-1 border-gold/40 bg-gold/15 text-[10px] font-semibold text-gold"
                            >
                              <Pin aria-hidden className="h-3 w-3" />
                              {lang === "bn" ? "পিন করা" : "Pinned"}
                            </Badge>
                          ) : null}
                          <Badge variant="outline" className={cn("text-[10px] font-semibold", statusBadgeClass(notice.status))}>
                            {t(notice.status === "new" ? "label.new" : notice.status === "active" ? "label.active" : "label.closed")}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {t(`notice.cat.${notice.category}` as Parameters<typeof t>[0])}
                          </span>
                        </div>
                        <h3 className="mt-1.5 line-clamp-1 text-[15px] font-semibold transition-colors group-hover:text-primary">
                          {pick(notice.title, lang)}
                        </h3>
                        <p className="mt-1 hidden line-clamp-1 text-[13px] text-muted-foreground sm:block">
                          {pick(notice.excerpt, lang)}
                        </p>
                      </div>
                      <div className="hidden shrink-0 flex-col items-end gap-1 text-[12px] text-muted-foreground sm:flex">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays aria-hidden className="h-3.5 w-3.5 text-gold" />
                          {formatDate(notice.publishedAt, lang)}
                        </span>
                        <span>{daysAgoLabel(notice.publishedAt, lang)}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Reveal className="mt-8 flex justify-center">
          <Link
            href={langPath(lang, "/notices")}
            className="inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Bell aria-hidden className="h-4 w-4" />
            {t("action.viewNoticeBoard")}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
