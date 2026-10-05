import Link from "next/link";
import type { Metadata } from "next";
import {
  Archive,
  Bell,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Megaphone,
  Pin,
  SearchX,
} from "lucide-react";
import { db } from "@/lib/db";
import type { NoticeCategory as DbNoticeCategory, NoticeStatus as DbNoticeStatus } from "@prisma/client";
import type { Lang } from "@/lib/locale";
import { langPath, alternatesFor } from "@/lib/locale";
import { isFeatureEnabled } from "@/lib/settings";
import { getSiteConfig } from "@/lib/content/site";
import { env } from "@/lib/env";
import { ModuleUnavailable } from "@/components/shared/module-unavailable";
import { NOTICE_CATEGORIES, type Language, type NoticeCategory, type NoticeStatus } from "@/types";
import { formatMonthYear, toBnDigits } from "@/lib/format";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { NoticeCard } from "@/components/notices/notice-card";
import { NoticeSearch } from "@/components/notices/notice-search";
import { NoticeDeepLink } from "@/components/notices/notice-deep-link";
import type { NoticeDetailData } from "@/components/notices/notice-dialog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const siteConfig = await getSiteConfig();
  const { canonical, languages } = alternatesFor("/notices", env.siteUrl);
  return {
    title: isBn ? `নোটিশ বোর্ড — ${siteConfig.shortBn}` : `Notice Board — ${siteConfig.shortEn}`,
    description: isBn
      ? "ভর্তি, নিয়োগ, একাডেমিক ও সাধারণ — আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউটের সকল দাপ্তরিক বিজ্ঞপ্তি।"
      : "Admission, recruitment, academic, and general — every official announcement of the As-Sunnah Dawah and Research Institute.",
    alternates: { canonical, languages },
  };
}

const PAGE_SIZE = 10;

const CATEGORY_TABS: { id: NoticeCategory; icon: typeof Bell }[] = [
  { id: "admission", icon: GraduationCap },
  { id: "recruitment", icon: Briefcase },
  { id: "academic", icon: FileText },
  { id: "general", icon: Megaphone },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const NOTICE_INCLUDE = { attachment: { select: { key: true } } } as const;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildNoticesUrl(
  lang: Lang,
  params: { category?: string; q?: string; page?: number; keepPage?: boolean },
): string {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.q) search.set("q", params.q);
  if (params.page && (params.keepPage || params.page > 1)) search.set("page", String(params.page));
  const qs = search.toString();
  return langPath(lang, qs ? `/notices?${qs}` : "/notices");
}

interface PrismaNoticeRow {
  slug: string;
  titleBn: string;
  titleEn: string;
  excerptBn: string;
  excerptEn: string;
  bodyBn: string;
  bodyEn: string;
  category: DbNoticeCategory;
  status: DbNoticeStatus;
  pinned: boolean;
  attachment: { key: string } | null;
  publishedAt: Date;
}

function serializeNotice(row: PrismaNoticeRow): NoticeDetailData {
  return {
    slug: row.slug,
    title: { bn: row.titleBn, en: row.titleEn },
    excerpt: { bn: row.excerptBn, en: row.excerptEn },
    body: { bn: row.bodyBn, en: row.bodyEn },
    category: (NOTICE_CATEGORIES.includes(row.category.toLowerCase() as NoticeCategory)
      ? row.category.toLowerCase()
      : "general") as NoticeCategory,
    status: (["new", "active", "closed"].includes(row.status.toLowerCase())
      ? row.status.toLowerCase()
      : "closed") as NoticeStatus,
    attachmentUrl: row.attachment ? `/api/media/${row.attachment.key}` : null,
    publishedAt: row.publishedAt.toISOString(),
  };
}

export default async function NoticesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Lang }>;
  searchParams: SearchParams;
}) {
  const { lang } = await params;
  if (!(await isFeatureEnabled("notices"))) {
    return <ModuleUnavailable lang={lang} moduleLabelBn="নোটিশ বোর্ড" moduleLabelEn="Notice board" />;
  }
  const sp = await searchParams;

  const rawCategory = firstParam(sp.category);
  const category =
    rawCategory && NOTICE_CATEGORIES.includes(rawCategory as NoticeCategory)
      ? (rawCategory as NoticeCategory)
      : undefined;
  const q = (firstParam(sp.q) ?? "").trim().slice(0, 120);
  const page = Math.min(500, Math.max(1, Number.parseInt(firstParam(sp.page) ?? "1", 10) || 1));
  const noticeSlug = firstParam(sp.notice);

  const where = {
    isPublished: true,
    ...(category ? { category: category.toUpperCase() as DbNoticeCategory } : {}),
    ...(q
      ? {
          OR: [
            { titleBn: { contains: q } },
            { titleEn: { contains: q } },
            { excerptBn: { contains: q } },
            { excerptEn: { contains: q } },
          ],
        }
      : {}),
  };

  // Pinned notices stay above the regular flow when they match the active
  // category/search filter (no pinned match → no pinned section). They are
  // excluded from the paginated list so they never consume page slots.
  const pinnedWhere = { ...where, pinned: true };
  const regularWhere = { ...where, pinned: false };

  const [total, regularTotal, pinnedRows, rows, deepRow] = await Promise.all([
    db.notice.count({ where }),
    db.notice.count({ where: regularWhere }),
    db.notice.findMany({ where: pinnedWhere, orderBy: { publishedAt: "desc" }, include: NOTICE_INCLUDE }),
    db.notice.findMany({
      where: regularWhere,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: NOTICE_INCLUDE,
    }),
    noticeSlug ? db.notice.findUnique({ where: { slug: noticeSlug }, include: NOTICE_INCLUDE }) : Promise.resolve(null),
  ]);

  const notices = rows.map(serializeNotice);
  const pinnedNotices = pinnedRows.map(serializeNotice);
  const deepNotice = deepRow ? serializeNotice(deepRow as PrismaNoticeRow) : null;
  const totalPages = Math.max(1, Math.ceil(regularTotal / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // Group the visible notices under month/year archive headers.
  const groups: { key: string; label: string; items: NoticeDetailData[] }[] = [];
  for (const notice of notices) {
    const key = notice.publishedAt.slice(0, 7);
    const label = formatMonthYear(notice.publishedAt, lang);
    const existing = groups.find((group) => group.key === key);
    if (existing) existing.items.push(notice);
    else groups.push({ key, label, items: [notice] });
  }

  return (
    <>
      <PageHero
        lang={lang}
        eyebrow={{ bn: "দাপ্তরিক বিজ্ঞপ্তি", en: "Official Announcements" }}
        title={{ bn: "নোটিশ বোর্ড", en: "Notice Board" }}
        description={{
          bn: "ভর্তি, নিয়োগ, একাডেমিক ও সাধারণ — ইনস্টিটিউটের সকল আনুষ্ঠানিক বিজ্ঞপ্তি কালানুক্রমিকভাবে সাজানো। প্রতিটি নোটিশের বিস্তারিত ও সংযুক্ত ফাইল এক ক্লিকেই।",
          en: "Admission, recruitment, academic, and general — every official institute circular in one chronological board, with full details and attachments one click away.",
        }}
        meta={{
          textBn: `মোট ${toBnDigits(total)} টি নোটিশ`,
          textEn: `${total} notices`,
        }}
        breadcrumb={[{ label: { bn: "নোটিশ বোর্ড", en: "Notices" } }]}
        arabicEcho="وَأَتِمِّوا بِالْعَهْدِ إِنَّ الْعَهْدَ كَانَ مَسْئُولًا"
      />

      <section className="bg-parchment py-14 sm:py-20">
        <div className="container-site">
          {/* ————— Search island ————— */}
          <Reveal className="mb-8">
            <NoticeSearch initialQuery={q} category={category} />
          </Reveal>

          {/* ————— Category tabs (links → URL params) ————— */}
          <Reveal delay={0.05}>
            <nav aria-label={lang === "bn" ? "ক্যাটাগরি" : "Categories"} className="mb-10 flex flex-wrap items-center justify-center gap-2">
              <Link
                href={buildNoticesUrl(lang, { q, category: undefined })}
                aria-current={category ? undefined : "page"}
                className={cn(
                  "rounded-full px-4 py-2 text-[13px] font-medium transition-all",
                  !category
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {lang === "bn" ? "সব" : "All"}
              </Link>
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = category === tab.id;
                return (
                  <Link
                    key={tab.id}
                    href={buildNoticesUrl(lang, { category: tab.id, q })}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <Icon aria-hidden className="h-3.5 w-3.5" />
                    {lang === "bn"
                      ? { admission: "ভর্তি", recruitment: "নিয়োগ", academic: "একাডেমিক", general: "সাধারণ" }[tab.id]
                      : { admission: "Admission", recruitment: "Recruitment", academic: "Academic", general: "General" }[tab.id]}
                  </Link>
                );
              })}
            </nav>
          </Reveal>

          {/* ————— Result summary + archive note ————— */}
          <div className="mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" role="status">
              {lang === "bn"
                ? `${toBnDigits(total)} টি নোটিশ পাওয়া গেছে${q ? ` — “${q}” এর জন্য` : ""}`
                : `${total} notices found${q ? ` for “${q}”` : ""}`}
            </p>
            <p className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground/80">
              <Archive aria-hidden className="h-3.5 w-3.5 text-gold" />
              {lang === "bn"
                ? "মাস ও বছর অনুযায়ী গ্রুপবদ্ধ · নতুন নোটিশ উপরে"
                : "Grouped by month & year · newest first"}
            </p>
          </div>

          {/* ————— Notices: pinned group + month groups ————— */}
          {notices.length === 0 && pinnedNotices.length === 0 ? (
            <div className="mx-auto max-w-3xl rounded-2xl border border-dashed p-12 text-center">
              <SearchX aria-hidden className="mx-auto mb-3 h-10 w-10 text-gold/60" />
              <p className="font-heading text-lg font-semibold">
                {lang === "bn" ? "কোনো নোটিশ পাওয়া যায়নি" : "No notices found"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {lang === "bn"
                  ? "খুঁজে ফেলার শব্দ বা ক্যাটাগরি পরিবর্তন করে আবার চেষ্টা করুন।"
                  : "Try changing the search term or category."}
              </p>
              <Link
                href={langPath(lang, "/notices")}
                className="mt-5 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {lang === "bn" ? "সব নোটিশ দেখুন" : "View all notices"}
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-8">
              {/* Pinned notices — gold-tinted group above the regular flow */}
              {pinnedNotices.length > 0 ? (
                <section aria-label={lang === "bn" ? "পিন করা নোটিশ" : "Pinned notices"}>
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/15 text-gold"
                    >
                      <Pin className="h-4 w-4" />
                    </span>
                    <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-gold">
                      {lang === "bn" ? "পিন করা নোটিশ" : "Pinned Notices"}
                    </h2>
                    <span aria-hidden className="h-px flex-1 bg-gold/30" />
                    <span className="text-[11px] font-semibold text-gold/80">
                      {toBnDigits(pinnedNotices.length)} {lang === "bn" ? "টি" : ""}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {pinnedNotices.map((notice) => (
                      <NoticeCard key={notice.slug} notice={notice} lang={lang} pinned />
                    ))}
                  </div>
                </section>
              ) : null}

              {groups.map((group) => (
                <section key={group.key} aria-label={group.label}>
                  <div className="mb-4 flex items-center gap-3">
                    <span aria-hidden className="h-px w-8 bg-gold/60" />
                    <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </h2>
                    <span aria-hidden className="h-px flex-1 bg-border" />
                    <span className="text-[11px] text-muted-foreground/70">
                      {toBnDigits(group.items.length)} {lang === "bn" ? "টি" : ""}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((notice) => (
                      <NoticeCard key={notice.slug} notice={notice} lang={lang} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* ————— Pagination ————— */}
          {totalPages > 1 ? (
            <nav
              aria-label={lang === "bn" ? "পেজিনেশন" : "Pagination"}
              className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
            >
              {safePage > 1 ? (
                <Link
                  href={buildNoticesUrl(lang, { category, q, page: safePage - 1, keepPage: true })}
                  aria-label={lang === "bn" ? "পূর্ববর্তী পাতা" : "Previous page"}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
                >
                  <ChevronLeft aria-hidden className="h-4 w-4" />
                </Link>
              ) : null}
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <Link
                  key={pageNumber}
                  href={buildNoticesUrl(lang, { category, q, page: pageNumber })}
                  aria-current={pageNumber === safePage ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors",
                    pageNumber === safePage
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "border bg-card text-muted-foreground hover:border-gold/50 hover:text-foreground",
                  )}
                >
                  {lang === "bn" ? toBnDigits(pageNumber) : pageNumber}
                </Link>
              ))}
              {safePage < totalPages ? (
                <Link
                  href={buildNoticesUrl(lang, { category, q, page: safePage + 1, keepPage: true })}
                  aria-label={lang === "bn" ? "পরবর্তী পাতা" : "Next page"}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
                >
                  <ChevronRight aria-hidden className="h-4 w-4" />
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </section>

      {/* ————— Deep-link dialog (?notice=slug) ————— */}
      {deepNotice ? (
        <NoticeDeepLink
          notice={deepNotice}
          lang={lang}
          returnPath={buildNoticesUrl(lang, { category, q, page: safePage, keepPage: true })}
        />
      ) : null}
    </>
  );
}
