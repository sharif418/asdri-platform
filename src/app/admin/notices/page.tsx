import Link from "next/link";
import { Megaphone, Pin, Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { roleCan, getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminPager } from "@/components/admin/admin-pager";

export const metadata = { title: "নোটিশ বোর্ড" };

const CATEGORY_LABELS: Record<string, string> = {
  ADMISSION: "ভর্তি",
  RECRUITMENT: "নিয়োগ",
  ACADEMIC: "একাডেমিক",
  GENERAL: "সাধারণ",
};
const STATUS_LABELS: Record<string, string> = {
  NEW: "নতুন",
  ACTIVE: "চলছে",
  CLOSED: "শেষ",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 20;

function buildQuery(base: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(base)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `/admin/notices?${params.toString()}`;
}

/** Notice board admin — list, filter, and jump into the editor. */
export default async function AdminNoticesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content")) redirect("/admin");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);
  const category = typeof sp.category === "string" && sp.category in CATEGORY_LABELS ? sp.category : undefined;

  const requestedPage = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const where = {
    ...(category ? { category: category as keyof typeof CATEGORY_LABELS as never } : {}),
    ...(q ? { OR: [{ titleBn: { contains: q } }, { titleEn: { contains: q } }] } : {}),
  };

  // Count first so an out-of-range ?page= is clamped instead of showing an
  // empty page under a pager that claims records exist.
  const total = await db.notice.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);

  const notices = await db.notice.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: { id: true, slug: true, titleBn: true, titleEn: true, category: true, status: true, pinned: true, isPublished: true, publishedAt: true, attachment: { select: { filename: true } } },
  });
  const hasFilter = Boolean(q || category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <Megaphone aria-hidden className="h-6 w-6 text-primary" />
            নোটিশ বোর্ড
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ভর্তি, নিয়োগ, একাডেমিক ও সাধারণ বিজ্ঞপ্তি — ওয়েবসাইটের নোটিশ বোর্ড এখান থেকেই পরিচালিত হয়।
          </p>
        </div>
        <Link
          href="/admin/notices/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus aria-hidden className="h-4 w-4" />
          নতুন নোটিশ
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/notices" method="get">
        <div className="relative min-w-52 flex-1">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="শিরোনাম দিয়ে খুঁজুন…"
            className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <select name="category" defaultValue={category ?? ""} className="rounded-lg border bg-card px-3 py-2 text-sm">
          <option value="">সব ক্যাটাগরি</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
          ফিল্টার
        </button>
      </form>

      <div className="mt-4 max-h-[70vh] overflow-x-auto overflow-y-auto rounded-2xl border bg-card shadow-sm">
        {notices.length === 0 ? (
          hasFilter ? (
            <div className="px-6 py-16 text-center">
              <p className="font-heading text-lg font-bold">কোনো ফলাফল পাওয়া যায়নি</p>
              <p className="mt-1 text-sm text-muted-foreground">অনুসন্ধানের সাথে মিলে যায় এমন কিছু পাওয়া যায়নি।</p>
              <Link href="/admin/notices" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
                ফিল্টার খুলে ফেলুন
              </Link>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="font-heading text-lg font-bold">এখনো কোনো নোটিশ নেই</p>
              <p className="mt-1 text-sm text-muted-foreground">প্রথম নোটিশটি তৈরি করুন — এটি সাথে সাথেই ওয়েবসাইটে দেখা যাবে।</p>
              <Link href="/admin/notices/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                <Plus aria-hidden className="h-4 w-4" />
                নোটিশ তৈরি করুন
              </Link>
            </div>
          )
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">শিরোনাম</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">ক্যাটাগরি</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">অবস্থা</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">প্রকাশ</th>
                <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {notices.map((notice) => (
                <tr key={notice.id} className="transition-colors hover:bg-secondary/20">
                  <td className="max-w-md px-4 py-3">
                    <Link href={`/admin/notices/${notice.slug}`} className="flex items-center gap-2 font-medium hover:text-primary">
                      {notice.pinned ? <Pin aria-hidden className="h-3.5 w-3.5 shrink-0 text-gold" /> : null}
                      <span className="truncate">{notice.titleBn}</span>
                      {!notice.isPublished && (
                        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9.5px] font-bold text-muted-foreground">
                          খসড়া
                        </span>
                      )}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(notice.publishedAt, "bn")}</p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">
                      {CATEGORY_LABELS[notice.category]}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold",
                        notice.status === "NEW" && "bg-gold/15 text-gold",
                        notice.status === "ACTIVE" && "bg-primary/10 text-primary",
                        notice.status === "CLOSED" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {STATUS_LABELS[notice.status]}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className={cn("text-[11.5px] font-semibold", notice.isPublished ? "text-primary" : "text-muted-foreground")}>
                      {notice.isPublished ? "প্রকাশিত" : "ড্রাফট"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/notices/${notice.slug}`} className="text-[12.5px] font-semibold text-primary hover:underline">
                      সম্পাদনা
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AdminPager
        page={page}
        pageCount={pageCount}
        total={total}
        unit="নোটিশ"
        buildHref={(next) => buildQuery({ q: q || undefined, category }, next)}
      />
    </div>
  );
}
