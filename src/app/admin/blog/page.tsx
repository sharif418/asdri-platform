import Link from "next/link";
import { PenLine, Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatDate, formatNumber, toBnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AdminPager } from "@/components/admin/admin-pager";

export const metadata = { title: "ব্লগ ও আর্টিকেল" };

const KIND_LABELS: Record<string, string> = {
  ARTICLE: "আর্টিকল",
  CLARIFICATION: "সংশয় নিরসন",
  NEWS: "খবর",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 20;

function buildQuery(base: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(base)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `/admin/blog?${params.toString()}`;
}

/** Blog & articles list — title, category, author, status, views. */
export default async function AdminBlogPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content")) redirect("/admin");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);
  const kind = typeof sp.kind === "string" && sp.kind in KIND_LABELS ? sp.kind : undefined;
  const requestedPage = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const where = {
    ...(kind ? { kind: kind as keyof typeof KIND_LABELS as never } : {}),
    ...(q ? { OR: [{ titleBn: { contains: q } }, { titleEn: { contains: q, mode: "insensitive" as const } }] } : {}),
  };

  // Count first so an out-of-range ?page= is clamped instead of showing an
  // empty page under a pager that claims records exist (r4 M7).
  const total = await db.post.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);

  const posts = await db.post.findMany({
    where,
    orderBy: [{ isPublished: "asc" }, { publishedAt: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      slug: true,
      titleBn: true,
      kind: true,
      isPublished: true,
      publishedAt: true,
      views: true,
      readingMinutes: true,
      category: { select: { nameBn: true } },
      author: { select: { nameBn: true } },
    },
  });
  const hasFilter = Boolean(q || kind);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <PenLine aria-hidden className="h-6 w-6 text-primary" />
            ব্লগ ও আর্টিকেল
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            গবেষণামূলক আর্টিকেল, সংশয় নিরসন ও খবর — বাংলা ও ইংরেজি দুই ভাষায়।
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus aria-hidden className="h-4 w-4" />
          নতুন পোস্ট
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/blog" method="get">
        <div className="relative min-w-52 flex-1">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="শিরোনাম দিয়ে খুঁজুন…"
            className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <select name="kind" defaultValue={kind ?? ""} aria-label="ধরন ফিল্টার" className="rounded-lg border bg-card px-3 py-2 text-sm">
          <option value="">সব ধরন</option>
          {Object.entries(KIND_LABELS).map(([value, label]) => (
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
        {posts.length === 0 ? (
          hasFilter ? (
            <div className="px-6 py-16 text-center">
              <p className="font-heading text-lg font-bold">কোনো ফলাফল পাওয়া যায়নি</p>
              <p className="mt-1 text-sm text-muted-foreground">অনুসন্ধানের সাথে মিলে যায় এমন কিছু পাওয়া যায়নি।</p>
              <Link href="/admin/blog" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
                ফিল্টার খুলে ফেলুন
              </Link>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="font-heading text-lg font-bold">কোনো পোস্ট পাওয়া যায়নি</p>
              <p className="mt-1 text-sm text-muted-foreground">প্রথম আর্টিকেলটি লিখুন — বাংলা দুই ভাষায় পড়া যাবে।</p>
              <Link href="/admin/blog/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                <Plus aria-hidden className="h-4 w-4" />
                পোস্ট তৈরি করুন
              </Link>
            </div>
          )
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">শিরোনাম</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">ধরন</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">ক্যাটাগরি</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">লেখক</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">অবস্থা</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">পঠন</th>
                <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map((post) => (
                <tr key={post.id} className="transition-colors hover:bg-secondary/20">
                  <td className="max-w-md px-4 py-3">
                    <Link href={`/admin/blog/${post.slug}`} className="block truncate font-medium hover:text-primary">
                      {post.titleBn}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {post.publishedAt ? formatDate(post.publishedAt, "bn") : "খসড়া"}
                      {post.readingMinutes ? ` · ${toBnDigits(post.readingMinutes)} মিনিট` : ""}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">{KIND_LABELS[post.kind]}</span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="text-[12.5px] text-muted-foreground">{post.category?.nameBn ?? "—"}</span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="text-[12.5px] text-muted-foreground">{post.author?.nameBn ?? "—"}</span>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className={cn("text-[11.5px] font-semibold", post.isPublished ? "text-primary" : "text-muted-foreground")}>
                      {post.isPublished ? "প্রকাশিত" : "ড্রাফট"}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className="text-[12.5px] text-muted-foreground">{formatNumber(post.views, "bn")}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/blog/${post.slug}`} className="text-[12.5px] font-semibold text-primary hover:underline">
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
        unit="পোস্ট"
        buildHref={(next) => buildQuery({ q: q || undefined, kind }, next)}
      />
    </div>
  );
}
