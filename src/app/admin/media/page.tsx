import Link from "next/link";
import { Archive, ChevronLeft, ChevronRight, FileText, ImageIcon, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatNumber } from "@/lib/format";
import { MediaCard, MediaUploadPanel, type MediaRow } from "@/components/admin/media-kit";

export const metadata = { title: "মিডিয়া লাইব্রেরি" };

const PAGE_SIZE = 50;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Prev/next pagination (server-rendered links, query-preserving). */
function Pager({
  basePath,
  page,
  pageCount,
  pageParam = "page",
  extra,
}: {
  basePath: string;
  page: number;
  pageCount: number;
  pageParam?: string;
  extra: Record<string, string>;
}) {
  if (pageCount <= 1) return null;
  const build = (p: number) => {
    const params = new URLSearchParams(extra);
    params.set(pageParam, String(p));
    return `${basePath}?${params.toString()}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        পৃষ্ঠা {formatNumber(page, "bn")} / {formatNumber(pageCount, "bn")}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={build(page - 1)} className="inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 font-semibold hover:bg-secondary">
            <ChevronLeft aria-hidden className="h-3.5 w-3.5" /> পূর্ববর্তী
          </Link>
        )}
        {page < pageCount && (
          <Link href={build(page + 1)} className="inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 font-semibold hover:bg-secondary">
            পরবর্তী <ChevronRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

/** Media library — images first, documents in their own section. */
export default async function AdminMediaPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "media.upload")) redirect("/admin");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);
  const dpage = Math.max(1, Number.parseInt(typeof sp.dpage === "string" ? sp.dpage : "1", 10) || 1);

  const searchWhere = q
    ? {
        OR: [
          { filename: { contains: q, mode: "insensitive" as const } },
          { altBn: { contains: q } },
          { altEn: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const select = {
    id: true,
    key: true,
    filename: true,
    mime: true,
    size: true,
    width: true,
    height: true,
    altBn: true,
    altEn: true,
    kind: true,
  };

  const [imageCount, documentCount, images, documents] = await Promise.all([
    db.media.count({ where: { kind: "IMAGE", ...searchWhere } }),
    db.media.count({ where: { kind: "DOCUMENT", ...searchWhere } }),
    db.media.findMany({
      where: { kind: "IMAGE", ...searchWhere },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select,
    }),
    db.media.findMany({
      where: { kind: "DOCUMENT", ...searchWhere },
      orderBy: { createdAt: "desc" },
      skip: (dpage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select,
    }),
  ]);

  const imagePages = Math.max(1, Math.ceil(imageCount / PAGE_SIZE));
  const docPages = Math.max(1, Math.ceil(documentCount / PAGE_SIZE));
  const extra: Record<string, string> = {};
  if (q) extra.q = q;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <Archive aria-hidden className="h-6 w-6 text-primary" />
            মিডিয়া লাইব্রেরি
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            সব ছবি ও ডকুমেন্ট এক জায়গায় — আপলোড, বিকল্প টেক্সট সম্পাদনা ও মুছে ফেলা। ব্যবহৃত ফাইল সুরক্ষিত থাকে।
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          মোট {formatNumber(imageCount + documentCount, "bn")} টি ফাইল · ছবি {formatNumber(imageCount, "bn")} · ডকুমেন্ট {formatNumber(documentCount, "bn")}
        </p>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/media" method="get">
        <div className="relative min-w-52 flex-1">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="ফাইলনাম বা বিকল্প টেক্সট দিয়ে খুঁজুন…"
            className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
          অনুসন্ধান
        </button>
      </form>

      {/* ————— Images ————— */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <ImageIcon aria-hidden className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-lg font-bold">ছবি</h2>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {formatNumber(imageCount, "bn")}
          </span>
        </div>
        <div className="mt-3">
          <MediaUploadPanel kind="IMAGE" />
        </div>
        {images.length === 0 ? (
          <div className="mt-4 rounded-2xl border bg-card px-6 py-12 text-center">
            <p className="font-heading text-lg font-bold">কোনো ছবি পাওয়া যায়নি</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {q ? "অনুসন্ধানের সাথে মিলে এমন কোনো ছবি নেই।" : "উপরের প্যানেল থেকে প্রথম ছবিটি আপলোড করুন।"}
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((media) => (
              <MediaCard key={media.id} media={media as MediaRow} />
            ))}
          </div>
        )}
        <Pager basePath="/admin/media" page={page} pageCount={imagePages} extra={extra} />
      </section>

      {/* ————— Documents ————— */}
      <section className="mt-12">
        <div className="flex items-center gap-2">
          <FileText aria-hidden className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-lg font-bold">ডকুমেন্ট (PDF)</h2>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {formatNumber(documentCount, "bn")}
          </span>
        </div>
        <div className="mt-3">
          <MediaUploadPanel kind="DOCUMENT" />
        </div>
        {documents.length === 0 ? (
          <div className="mt-4 rounded-2xl border bg-card px-6 py-12 text-center">
            <p className="font-heading text-lg font-bold">কোনো ডকুমেন্ট নেই</p>
            <p className="mt-1 text-sm text-muted-foreground">নোটিশ সংযুক্তি ও প্রকাশনার পিডিএফ এখানে জমা হয়।</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {documents.map((media) => (
              <MediaCard key={media.id} media={media as MediaRow} />
            ))}
          </div>
        )}
        <Pager basePath="/admin/media" page={dpage} pageCount={docPages} pageParam="dpage" extra={extra} />
      </section>
    </div>
  );
}
