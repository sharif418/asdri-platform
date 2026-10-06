import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, FileText, Inbox, Megaphone, GraduationCap, Briefcase, Pin } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { NoticeTabs, type TabCounts } from "@/components/home/notice-tabs";
import { feedTabs, type OfferedTab } from "@/content/home-islands";
import { Badge } from "@/components/ui/badge";
import { dictionaries, type DictionaryKey } from "@/lib/i18n";
import { listNotices, type NoticeFeedItem } from "@/lib/content/notices";
import { formatDate, daysAgoLabel } from "@/lib/format";
import { langPath } from "@/lib/locale";
import { cn } from "@/lib/utils";
import type { Language, NoticeCategory } from "@/types";

const categoryIcons: Record<NoticeCategory, typeof Bell> = {
  admission: GraduationCap,
  academic: FileText,
  recruitment: Briefcase,
  general: Megaphone,
};

function statusBadgeClass(status: NoticeFeedItem["status"]): string {
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
const FEED_SIZE = 12;

function curate(items: NoticeFeedItem[]): NoticeFeedItem[] {
  const pinned = items.filter((n) => n.pinned).slice(0, MAX_PINNED);
  const pinnedIds = new Set(pinned.map((n) => n.id));
  const rest = items.filter((n) => !pinnedIds.has(n.id));
  return [...pinned, ...rest].slice(0, FEED_SIZE);
}

/** One notice card (server-rendered markup). data-category + data-rank drive the tab filter. */
function NoticeCard({
  notice,
  lang,
  t,
  rank,
  categoryRank,
  initiallyVisible,
}: {
  notice: NoticeFeedItem;
  lang: Language;
  t: (key: DictionaryKey) => string;
  rank: number;
  categoryRank: number;
  initiallyVisible: boolean;
}) {
  const Icon = categoryIcons[notice.category];
  return (
    <li
      data-category={notice.category}
      data-rank={rank}
      data-category-rank={categoryRank}
      hidden={!initiallyVisible}
    >
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
              {t(`notice.cat.${notice.category}` as DictionaryKey)}
            </span>
          </div>
          <h3 className="mt-1.5 line-clamp-1 text-[15px] font-semibold transition-colors group-hover:text-primary">
            {lang === "bn" ? notice.title.bn : notice.title.en}
          </h3>
          <p className="mt-1 hidden line-clamp-1 text-[13px] text-muted-foreground sm:block">
            {lang === "bn" ? notice.excerpt.bn : notice.excerpt.en}
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
}

/**
 * Recent notices — server-rendered feed with instant category tabs.
 *
 * Round 4: was a client island that fetched /api/notices after hydration
 * (skeleton flash, empty HTML for crawlers, extra round-trip). Now the DB
 * read happens in this server component and the markup ships with the
 * document. The cards render ONCE (no per-category panel duplication):
 * each <li> carries its category + ranks, and the tabs island
 * (src/components/home/notice-tabs.tsx) flips `hidden` client-side —
 * tab switches are instant and free. Without JS the default curated
 * "all" view renders.
 */
export async function NoticesFeed({ lang }: { lang: Language }) {
  const t = (key: DictionaryKey) => dictionaries[lang][key];
  const { items } = await listNotices({ pageSize: FEED_SIZE });
  const curated = curate(items);

  // Per-card ranks: global (for "all") and within-category (for category tabs).
  const seenPerCategory = new Map<string, number>();
  const cards = curated.map((notice, index) => {
    const categoryRank = seenPerCategory.get(notice.category) ?? 0;
    seenPerCategory.set(notice.category, categoryRank + 1);
    return { notice, rank: index, categoryRank };
  });

  const counts: TabCounts = {
    all: Math.min(curated.length, MAX_SHOWN),
    ...Object.fromEntries(
      feedTabs
        .filter((tab) => tab.id !== "all")
        .map((tab) => [tab.id, curated.filter((n) => n.category === (tab.id as OfferedTab)).length] as const),
    ),
  } as TabCounts;

  return (
    <section id="home-notices" data-active-tab="all" className="py-16 sm:py-24">
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
          <div className="mt-8">
            <NoticeTabs lang={lang} counts={counts} />
          </div>
        </Reveal>

        <div className="mx-auto mt-8 max-w-4xl">
          {curated.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <Inbox aria-hidden className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">{t("label.noResults")}</p>
            </div>
          ) : (
            <ul id="home-notice-list" className="space-y-3">
              {cards.map(({ notice, rank, categoryRank }) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  lang={lang}
                  t={t}
                  rank={rank}
                  categoryRank={categoryRank}
                  initiallyVisible={rank < MAX_SHOWN}
                />
              ))}
            </ul>
          )}
        </div>

        <Reveal className="mt-8 flex justify-center">
          <Link
            href={langPath(lang, "/notices")}
            className="inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-semibold text-primary transition-colors outline-none hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
