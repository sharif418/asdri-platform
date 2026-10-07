import Link from "next/link";
import { BookMarked, MessageSquareQuote, Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FatwaCategoryManager } from "@/components/admin/fatwa-category-manager";

export const metadata = { title: "ফতোয়া ব্যাংক" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Fatwa bank — published Q/A entries with the category manager. */
export default async function AdminFatwaEntriesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "fatwa.read")) redirect("/admin");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);
  const category = typeof sp.category === "string" ? sp.category.trim().slice(0, 40) : "";

  const where = {
    ...(category ? { categoryId: category } : {}),
    ...(q ? { OR: [{ questionBn: { contains: q } }, { questionEn: { contains: q } }, { slug: { contains: q } }] } : {}),
  };

  const [entries, categories] = await Promise.all([
    db.fatwaEntry.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: 200,
      select: {
        id: true,
        slug: true,
        questionBn: true,
        answeredBy: true,
        isPublished: true,
        publishedAt: true,
        category: { select: { nameBn: true } },
      },
    }),
    db.fatwaCategory.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, key: true, nameBn: true, nameEn: true, sortOrder: true, _count: { select: { entries: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <BookMarked aria-hidden className="h-6 w-6 text-primary" />
            ফতোয়া ব্যাংক
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            প্রকাশিত ফতোয়াসমূহ — জিজ্ঞাসা ইনবক্স থেকে প্রকাশ করা ফতোয়াও এখানে সম্পাদনা করা যায়।
          </p>
        </div>
        <Link
          href="/admin/fatwa/entries/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus aria-hidden className="h-4 w-4" />
          নতুন ফতোয়া
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/fatwa/entries" method="get">
        <div className="relative min-w-52 flex-1">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="প্রশ্ন বা স্লাগ দিয়ে খুঁজুন…"
            className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <select name="category" defaultValue={category} className="rounded-lg border bg-card px-3 py-2 text-sm">
          <option value="">সব ক্যাটাগরি</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameBn}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
          ফিল্টার
        </button>
      </form>

      <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-x-auto overflow-y-clip rounded-2xl border bg-card shadow-sm">
          {entries.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-heading text-lg font-bold">কোনো ফতোয়া পাওয়া যায়নি</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {q || category ? "ফিল্টার বদলে আবার দেখুন।" : "নতুন ফতোয়া যোগ করুন অথবা ইনবক্স থেকে প্রকাশ করুন।"}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link
                  href="/admin/fatwa/entries/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  <Plus aria-hidden className="h-4 w-4" />
                  ফতোয়া যোগ করুন
                </Link>
                <Link
                  href="/admin/fatwa/questions"
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-secondary"
                >
                  <MessageSquareQuote aria-hidden className="h-4 w-4" />
                  ইনবক্স দেখুন
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/30 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">প্রশ্ন</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">ক্যাটাগরি</th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">উত্তরদাতা</th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">প্রকাশ</th>
                  <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-secondary/20">
                    <td className="max-w-lg px-4 py-3">
                      <Link href={`/admin/fatwa/entries/${entry.id}`} className="block truncate font-medium hover:text-primary" dir="auto">
                        {entry.questionBn}
                      </Link>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground" dir="ltr">
                        {entry.slug}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">
                        {entry.category?.nameBn ?? "—"}
                      </span>
                    </td>
                    <td className="hidden max-w-40 truncate px-4 py-3 text-[12.5px] text-muted-foreground lg:table-cell" dir="auto">
                      {entry.answeredBy}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className={cn("text-[11.5px] font-semibold", entry.isPublished ? "text-primary" : "text-muted-foreground")}>
                        {entry.isPublished ? "প্রকাশিত" : "ড্রাফট"}
                      </span>
                      <p className="text-[10.5px] text-muted-foreground">{formatDate(entry.publishedAt, "bn")}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/fatwa/entries/${entry.id}`} className="text-[12.5px] font-semibold text-primary hover:underline">
                        সম্পাদনা
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="h-fit">
          <FatwaCategoryManager
            categories={categories.map((c) => ({
              id: c.id,
              key: c.key,
              nameBn: c.nameBn,
              nameEn: c.nameEn,
              sortOrder: c.sortOrder,
              entryCount: c._count.entries,
            }))}
          />
          <p className="mt-2 px-1 text-[11.5px] text-muted-foreground">
            মোট ফতোয়া: <span className="font-bold text-foreground">{formatNumber(entries.length, "bn")}</span>টি
          </p>
        </aside>
      </div>
    </div>
  );
}
