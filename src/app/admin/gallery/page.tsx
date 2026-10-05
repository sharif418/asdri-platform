import Link from "next/link";
import { Images, Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "গ্যালারি" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Gallery albums list — cover, photo count, publish state. */
export default async function AdminGalleryPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content")) redirect("/admin");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);

  const albums = await db.album.findMany({
    where: q
      ? { OR: [{ titleBn: { contains: q } }, { titleEn: { contains: q, mode: "insensitive" as const } }] }
      : undefined,
    orderBy: [{ isPublished: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      slug: true,
      titleBn: true,
      titleEn: true,
      isPublished: true,
      sortOrder: true,
      createdAt: true,
      coverMedia: { select: { key: true } },
      _count: { select: { images: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <Images aria-hidden className="h-6 w-6 text-primary" />
            গ্যালারি
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ইভেন্ট ও ক্যাম্পাস জীবনের ফটো অ্যালবাম — ছবি যোগ, ক্রম ও ক্যাপশন ব্যবস্থাপনা।
          </p>
        </div>
        <Link
          href="/admin/gallery/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus aria-hidden className="h-4 w-4" />
          নতুন অ্যালবাম
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/gallery" method="get">
        <div className="relative min-w-52 flex-1">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="অ্যালবামের শিরোনাম দিয়ে খুঁজুন…"
            className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
          অনুসন্ধান
        </button>
      </form>

      {albums.length === 0 ? (
        <div className="mt-4 rounded-2xl border bg-card px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold">কোনো অ্যালবাম পাওয়া যায়নি</p>
          <p className="mt-1 text-sm text-muted-foreground">{q ? "অনুসন্ধানের সাথে মিলে এমন কোনো অ্যালবাম নেই।" : "প্রথম অ্যালবামটি তৈরি করুন।"}</p>
          <Link href="/admin/gallery/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Plus aria-hidden className="h-4 w-4" />
            অ্যালবাম তৈরি করুন
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/admin/gallery/${album.slug}`}
              className="group overflow-clip rounded-2xl border bg-card shadow-sm transition-colors hover:border-gold/50"
            >
              {album.coverMedia ? (
                <img
                  src={`/api/media/${album.coverMedia.key}`}
                  alt={album.titleBn}
                  className="h-40 w-full bg-secondary/40 object-cover transition-opacity group-hover:opacity-95"
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-secondary/40 text-muted-foreground">
                  <Images aria-hidden className="h-10 w-10" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-heading truncate text-[15px] font-bold">{album.titleBn}</p>
                  <span className={cn("shrink-0 text-[11px] font-bold", album.isPublished ? "text-primary" : "text-muted-foreground")}>
                    {album.isPublished ? "প্রকাশিত" : "ড্রাফট"}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  {formatNumber(album._count.images, "bn")} টি ছবি · তৈরি {formatDate(album.createdAt, "bn")} · ক্রম {formatNumber(album.sortOrder, "bn")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
