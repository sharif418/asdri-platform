import Link from "next/link";
import { Download, Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatNumber, toBnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "ডাউনলোড আইটেম" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Download centre admin — resources grouped by category. */
export default async function AdminDownloadsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content.manage")) redirect("/admin");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);

  const resources = await db.downloadResource.findMany({
    where: q ? { OR: [{ titleBn: { contains: q } }, { titleEn: { contains: q } }, { descriptionBn: { contains: q } }] } : undefined,
    orderBy: [{ categoryBn: "asc" }, { sortOrder: "asc" }],
    take: 300,
    select: {
      id: true,
      titleBn: true,
      categoryBn: true,
      course: { select: { id: true, titleBn: true } },
      sortOrder: true,
      isPublished: true,
      fileMedia: { select: { filename: true, size: true } },
    },
  });

  const groups = new Map<string, typeof resources>();
  for (const resource of resources) {
    const key = resource.categoryBn || "সাধারণ";
    const bucket = groups.get(key);
    if (bucket) bucket.push(resource);
    else groups.set(key, [resource]);
  }

  // Published rows without a file render as empty shells on the public
  // download page — surface the count to the officer without changing the
  // publish gate (r4 M16; data decision recorded by the coordinator).
  const filelessPublished = resources.filter((resource) => resource.isPublished && !resource.fileMedia).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <Download aria-hidden className="h-6 w-6 text-primary" />
            ডাউনলোড আইটেম
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ফরম, সিলেবাস, রুটিন ও পিডিএফ — ডাউনলোড সেন্টারে ক্যাটাগরিভিত্তিক দেখানো হয়।
          </p>
        </div>
        <Link
          href="/admin/research/downloads/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus aria-hidden className="h-4 w-4" />
          নতুন আইটেম
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/research/downloads" method="get">
        <div className="relative min-w-52 flex-1">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="শিরোনাম বা বিবরণ দিয়ে খুঁজুন…"
            className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
          ফিল্টার
        </button>
      </form>

      {resources.length === 0 ? (
        <div className="mt-4 rounded-2xl border bg-card px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold">কোনো ডাউনলোড আইটেম নেই</p>
          <p className="mt-1 text-sm text-muted-foreground">প্রথম আইটেমটি যোগ করুন।</p>
          <Link
            href="/admin/research/downloads/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus aria-hidden className="h-4 w-4" />
            আইটেম যোগ করুন
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {filelessPublished > 0 && (
            <p role="status" className="rounded-xl border border-gold/50 bg-gold/10 px-4 py-3 text-[12.5px] font-semibold text-gold-foreground dark:text-gold">
              ⚠ {toBnDigits(filelessPublished)}টি প্রকাশিত আইটেমে ফাইল সংযুক্ত নেই — পাবলিক ডাউনলোড পাতায় এগুলো খালি দেখাবে।
            </p>
          )}
          {[...groups.entries()].map(([category, items]) => (
            <section key={category}>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-base font-bold">{category}</h2>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {formatNumber(items.length, "bn")}
                </span>
              </div>
              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {items.map((resource) => (
                  <Link
                    key={resource.id}
                    href={`/admin/research/downloads/${resource.id}`}
                    className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:border-gold/50"
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
                        !resource.isPublished && "bg-muted text-muted-foreground",
                      )}
                    >
                      <Download aria-hidden className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold" dir="auto">
                        {resource.titleBn}
                      </p>
                      <p className="truncate text-[11.5px] text-muted-foreground" dir="ltr">
                        {resource.fileMedia ? resource.fileMedia.filename : "ফাইল সংযুক্ত নেই"}
                        {resource.fileMedia ? ` · ক্রম ${formatNumber(resource.sortOrder, "bn")}` : ""}
                      </p>
                      {resource.course ? (
                        <p className="truncate text-[11px] text-muted-foreground">কোর্স: {resource.course.titleBn}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={cn("text-[10.5px] font-bold", resource.isPublished ? "text-primary" : "text-muted-foreground")}>
                        {resource.isPublished ? "প্রকাশিত" : "ড্রাফট"}
                      </span>
                      {resource.fileMedia ? <span className="text-[10.5px] text-muted-foreground">পিডিএফ ✓</span> : <span className="text-[10.5px] text-destructive/70">ফাইল নেই</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
