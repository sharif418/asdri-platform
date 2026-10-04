import Link from "next/link";
import { CalendarRange, ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { db } from "@/lib/db";
import { getLang } from "@/lib/i18n-server";
import { toBnDigits } from "@/lib/format";
import { parseAuditRange, type AuditDateRange } from "@/lib/audit-range";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AuditTimeline } from "@/components/admin/audit-timeline";
import { Input } from "@/components/ui/input";
import type { AdminAuditEntryData } from "@/components/admin/admin-types";
import { cn } from "@/lib/utils";

export const metadata = { title: "অ্যাডমিন কার্যক্রম লগ" };

const PAGE_SIZE = 25;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function auditPageUrl(page: number, range: AuditDateRange | null): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (range) {
    params.set("from", range.from);
    params.set("to", range.to);
  }
  const qs = params.toString();
  return qs ? `/admin/audit?${qs}` : "/admin/audit";
}

/** Compact numbered window: 1 … (current−1) current (current+1) … last. */
function pageWindow(current: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const pages = new Set<number>([1, totalPages, current - 1, current, current + 1]);
  if (current <= 3) for (let p = 2; p <= 4; p += 1) pages.add(p);
  if (current >= totalPages - 2) for (let p = totalPages - 3; p < totalPages; p += 1) pages.add(p);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const window: (number | "gap")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) window.push("gap");
    window.push(p);
    prev = p;
  }
  return window;
}

/** /admin/audit — paginated, date-filtered, read-only accountability timeline (admin-only via layout). */
export default async function AdminAuditPage({ searchParams }: { searchParams: SearchParams }) {
  const lang = await getLang();
  const bn = lang === "bn";
  const sp = await searchParams;

  const requestedPage = Math.min(500, Math.max(1, Number.parseInt(firstParam(sp.page) ?? "1", 10) || 1));

  // Date-range filter: invalid or half-present pairs are ignored (helper
  // returns null) — the page then behaves exactly like the unfiltered view.
  const range = parseAuditRange(firstParam(sp.from), firstParam(sp.to));
  const where = range ? { createdAt: { gte: range.start, lte: range.end } } : undefined;

  // Count first so an out-of-range ?page= clamps before the window query.
  const total = await db.adminAction.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(requestedPage, totalPages);

  const rows = await db.adminAction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const rangeStart = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, total);

  const entries: AdminAuditEntryData[] = rows.map((row) => ({
    id: row.id,
    actorName: row.actorName,
    actorEmail: row.actorEmail,
    action: row.action,
    entityRef: row.entityRef,
    summaryBn: row.summaryBn,
    createdAt: row.createdAt.toISOString(),
  }));

  const exportHref = range
    ? `/api/admin/audit/export?from=${range.from}&to=${range.to}`
    : "/api/admin/audit/export";

  const rangeLabel = range ? (bn ? `${range.from} থেকে ${range.to}` : `${range.from} to ${range.to}`) : "";

  return (
    <>
      <AdminPageHeader
        eyebrow={bn ? "জবাবদিহিতা" : "Accountability"}
        title={bn ? "অ্যাডমিন কার্যক্রম লগ" : "Admin Activity Log"}
        description={
          bn
            ? "নোটিশ, ফতোয়া, বার্তা, ক্যাম্পেইন ও অনুদান সংক্রান্ত প্রতিটি পরিবর্তনের স্বয়ংক্রিয় নথি — কে, কখন, কী করেছে।"
            : "An automatic record of every notice, fatwa, message, campaign, and donation change — who did what, and when."
        }
      >
        <a
          href={exportHref}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold-gradient px-5 text-[13px] font-bold text-gold-foreground transition-opacity hover:opacity-90"
        >
          <Download aria-hidden className="h-4 w-4" />
          {bn ? "CSV এক্সপোর্ট" : "Export CSV"}
        </a>
      </AdminPageHeader>

      {/* Date-range filter bar (GET form — resets to page 1 on submit) */}
      <form
        method="get"
        action="/admin/audit"
        role="search"
        aria-label={bn ? "তারিখ অনুযায়ী ফিল্টার" : "Filter by date range"}
        className="mb-4 flex flex-wrap items-end gap-2.5 rounded-2xl border bg-card p-4 shadow-sm sm:items-center sm:p-3.5"
      >
        <div className="space-y-1">
          <label htmlFor="audit-from" className="block text-[11.5px] font-semibold text-muted-foreground">
            {bn ? "শুরু তারিখ" : "From"}
          </label>
          <Input
            id="audit-from"
            type="date"
            name="from"
            defaultValue={range?.from ?? ""}
            dir="ltr"
            className="h-11 w-[9.5rem] text-[13px]"
          />
        </div>
        <span aria-hidden className="pb-3.5 text-[12.5px] text-muted-foreground sm:pb-0">
          {bn ? "থেকে" : "to"}
        </span>
        <div className="space-y-1">
          <label htmlFor="audit-to" className="block text-[11.5px] font-semibold text-muted-foreground">
            {bn ? "শেষ তারিখ" : "To"}
          </label>
          <Input
            id="audit-to"
            type="date"
            name="to"
            defaultValue={range?.to ?? ""}
            dir="ltr"
            className="h-11 w-[9.5rem] text-[13px]"
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 text-[12.5px] font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground dark:text-gold dark:hover:bg-gold dark:hover:text-gold-foreground"
        >
          <CalendarRange aria-hidden className="h-4 w-4" />
          {bn ? "ফিল্টার" : "Filter"}
        </button>
        {range ? (
          <Link
            href="/admin/audit"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-4 text-[12.5px] font-bold text-gold transition-colors hover:bg-gold/20"
            aria-label={bn ? "তারিখ ফিল্টার মুছুন" : "Clear date filter"}
          >
            <X aria-hidden className="h-3.5 w-3.5" />
            {bn ? "মুছুন" : "Clear"}
          </Link>
        ) : null}
      </form>

      <p role="status" className="mb-4 text-[12.5px] text-muted-foreground">
        {bn
          ? `${range ? `${rangeLabel} · ` : ""}সর্বমোট ${toBnDigits(total)} টি কার্যক্রম · দেখানো হচ্ছে ${toBnDigits(rangeStart)}–${toBnDigits(rangeEnd)} · পাতা ${toBnDigits(safePage)}/${toBnDigits(totalPages)}`
          : `${range ? `${rangeLabel} · ` : ""}${total} actions total · showing ${rangeStart}–${rangeEnd} · page ${safePage}/${totalPages}`}
      </p>

      <AuditTimeline entries={entries} lang={lang} />

      {totalPages > 1 ? (
        <nav
          aria-label={bn ? "পেজিনেশন" : "Pagination"}
          className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
        >
          {safePage > 1 ? (
            <Link
              href={auditPageUrl(safePage - 1, range)}
              aria-label={bn ? "পূর্ববর্তী পাতা" : "Previous page"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
            >
              <ChevronLeft aria-hidden className="h-4 w-4" />
            </Link>
          ) : null}
          {pageWindow(safePage, totalPages).map((item, index) =>
            item === "gap" ? (
              <span key={`gap-${index}`} aria-hidden className="inline-flex h-10 w-8 items-center justify-center text-muted-foreground">
                …
              </span>
            ) : (
              <Link
                key={item}
                href={auditPageUrl(item, range)}
                aria-current={item === safePage ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors",
                  item === safePage
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border bg-card text-muted-foreground hover:border-gold/50 hover:text-foreground",
                )}
              >
                {bn ? toBnDigits(item) : item}
              </Link>
            ),
          )}
          {safePage < totalPages ? (
            <Link
              href={auditPageUrl(safePage + 1, range)}
              aria-label={bn ? "পরবর্তী পাতা" : "Next page"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
            >
              <ChevronRight aria-hidden className="h-4 w-4" />
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
