import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { toBnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "জার্নাল ও বই" };

const KIND_LABELS: Record<string, string> = {
  JOURNAL: "জার্নাল",
  MAGAZINE: "ম্যাগাজিন",
  BULLETIN: "বুলেটিন",
  BOOK: "বই",
  PAPER: "রিসার্চ পেপার",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Sample/placeholder identifiers from the seed ("2789-XXXX", "(sample)") — not real data. */
const PLACEHOLDER_ID_RE = /xxxx|sample/i;

/** Strip a redundant leading "ISSN "/"ISBN " the seed stored inside the value. */
function cleanIdentifier(value: string): string {
  return value.replace(/^\s*ISSN\s+/i, "").replace(/^\s*ISBN\s+/i, "").trim();
}

/** Real (non-sample) identifiers of a row, prefix-stripped — null when absent/placeholder. */
function realIdentifiers(publication: { issn: string | null; isbn: string | null }): { issn: string | null; isbn: string | null } {
  return {
    issn: publication.issn && !PLACEHOLDER_ID_RE.test(publication.issn) ? cleanIdentifier(publication.issn) : null,
    isbn: publication.isbn && !PLACEHOLDER_ID_RE.test(publication.isbn) ? cleanIdentifier(publication.isbn) : null,
  };
}

/** Publications admin — journals, books, bulletins, papers list. */
export default async function AdminPublicationsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content")) redirect("/admin");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);

  const publications = await db.publication.findMany({
    where: q ? { OR: [{ titleBn: { contains: q } }, { titleEn: { contains: q } }, { slug: { contains: q } }] } : undefined,
    orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
    take: 200,
    select: {
      id: true,
      slug: true,
      titleBn: true,
      kind: true,
      year: true,
      issn: true,
      isbn: true,
      isPublished: true,
      coverMedia: { select: { key: true } },
      fileMedia: { select: { filename: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <FileText aria-hidden className="h-6 w-6 text-primary" />
            জার্নাল ও বই
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            গবেষণা জার্নাল, বুলেটিন ও প্রকাশিত গ্রন্থ — প্রচ্ছদ ও পিডিএফ সংযুক্ত করা যায়।
          </p>
        </div>
        <Link
          href="/admin/research/publications/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus aria-hidden className="h-4 w-4" />
          নতুন প্রকাশনা
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/research/publications" method="get">
        <div className="relative min-w-52 flex-1">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="শিরোনাম দিয়ে খুঁজুন…"
            className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
          ফিল্টার
        </button>
      </form>

      <div className="mt-4 overflow-x-auto overflow-y-clip rounded-2xl border bg-card shadow-sm">
        {publications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-heading text-lg font-bold">কোনো প্রকাশনা নেই</p>
            <p className="mt-1 text-sm text-muted-foreground">প্রথম জার্নাল বা বইটি যোগ করুন।</p>
            <Link
              href="/admin/research/publications/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Plus aria-hidden className="h-4 w-4" />
              প্রকাশনা যোগ করুন
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">শিরোনাম</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">ধরন</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">সাল</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">ISSN / ISBN</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">ফাইল</th>
                <th className="hidden px-4 py-3 font-semibold xl:table-cell">প্রকাশ</th>
                <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {publications.map((publication) => {
                const ids = realIdentifiers(publication);
                return (
                <tr key={publication.id} className="transition-colors hover:bg-secondary/20">
                  <td className="max-w-md px-4 py-3">
                    <Link href={`/admin/research/publications/${publication.id}`} className="flex items-center gap-3">
                      {publication.coverMedia ? (
                        <img
                          src={`/api/media/${publication.coverMedia.key}`}
                          alt=""
                          className="h-11 w-8 shrink-0 rounded bg-secondary/40 object-cover"
                        />
                      ) : (
                        <span className="flex h-11 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                          <FileText aria-hidden className="h-4 w-4" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-medium" dir="auto">{publication.titleBn}</span>
                        <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground" dir="ltr">
                          {publication.slug}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">
                      {KIND_LABELS[publication.kind]}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-[12.5px] font-semibold md:table-cell" dir="ltr">
                    {toBnDigits(publication.year)}
                  </td>
                  <td className="hidden px-4 py-3 text-[11.5px] text-muted-foreground lg:table-cell" dir="ltr">
                    {ids.issn ? <span className="font-mono">ISSN {ids.issn}</span> : null}
                    {ids.issn && ids.isbn ? " · " : ""}
                    {ids.isbn ? <span className="font-mono">ISBN {ids.isbn}</span> : null}
                    {!ids.issn && !ids.isbn ? "—" : ""}
                  </td>
                  <td className="hidden max-w-40 truncate px-4 py-3 text-[11.5px] text-muted-foreground lg:table-cell" dir="ltr">
                    {publication.fileMedia?.filename ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 xl:table-cell">
                    <span className={cn("text-[11.5px] font-semibold", publication.isPublished ? "text-primary" : "text-muted-foreground")}>
                      {publication.isPublished ? "প্রকাশিত" : "ড্রাফট"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/research/publications/${publication.id}`} className="text-[12.5px] font-semibold text-primary hover:underline">
                      সম্পাদনা
                    </Link>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
