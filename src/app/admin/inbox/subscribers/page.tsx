import Link from "next/link";
import { Download, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatDate, formatNumber } from "@/lib/format";
import { AdminPager } from "@/components/admin/admin-pager";
import { cn } from "@/lib/utils";

export const metadata = { title: "নিউজলেটার সাবস্ক্রাইবার" };

const PAGE_SIZE = 50;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Newsletter subscribers — table + CSV export. */
export default async function AdminInboxSubscribersPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "messages")) redirect("/admin");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const where = q ? { email: { contains: q, mode: "insensitive" as const } } : {};
  const [total, subscribers] = await Promise.all([
    db.newsletterSubscriber.count({ where }),
    db.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, email: true, locale: true, confirmed: true, createdAt: true },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/inbox/messages" className="hover:text-primary">বার্তা ও সাবস্ক্রাইবার</Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">নিউজলেটার</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <Users aria-hidden className="h-6 w-6 text-primary" />
        নিউজলেটার সাবস্ক্রাইবার
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ফুটারের সাবস্ক্রাইব ফর্ম থেকে জমা হওয়া ঠিকানাগুলো — CSV নামিয়ে মেইলিং টুলে ব্যবহার করুন।
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <form className="flex flex-wrap gap-2" action="/admin/inbox/subscribers" method="get">
          <input
            name="q"
            defaultValue={q}
            placeholder="ইমেইল দিয়ে খুঁজুন…"
            dir="ltr"
            className="min-w-52 rounded-lg border bg-card px-3.5 py-2 text-sm outline-none focus:border-primary/50"
          />
          <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
            অনুসন্ধান
          </button>
        </form>
        <a
          href="/api/admin/subscribers/export"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Download aria-hidden className="h-4 w-4" />
          CSV এক্সপোর্ট ({formatNumber(total, "bn")})
        </a>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
        {subscribers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-heading text-lg font-bold">কোনো সাবস্ক্রাইবার নেই</p>
            <p className="mt-1 text-sm text-muted-foreground">{q ? "অনুসন্ধানের সাথে মিলে এমন কেউ নেই।" : "ফুটার ফর্ম থেকে প্রথম সাবস্ক্রাইব এলে এখানে দেখা যাবে।"}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">ইমেইল</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">ভাষা</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">নিশ্চিতকরণ</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">যোগ দিয়েছে</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="transition-colors hover:bg-secondary/20">
                  <td className="px-4 py-3" dir="ltr">
                    <span className="font-medium">{subscriber.email}</span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">
                      {subscriber.locale === "en" ? "English" : "বাংলা"}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className={cn("text-[11.5px] font-bold", subscriber.confirmed ? "text-primary" : "text-gold")}>
                      {subscriber.confirmed ? "নিশ্চিত" : "অনিশ্চিত"}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className="text-[12px] text-muted-foreground">{formatDate(subscriber.createdAt, "bn")}</span>
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
        unit="সাবস্ক্রাইবার"
        buildHref={(next) => `/admin/inbox/subscribers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(next) }).toString()}`}
      />
    </div>
  );
}
