import Link from "next/link";
import { FlaskConical, Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AdminPager } from "@/components/admin/admin-pager";

export const metadata = { title: "গবেষণা প্রকল্প" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 12;

function buildQuery(base: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(base)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return `/admin/research/projects?${params.toString()}`;
}

/** Research projects admin — progress, call-for-papers, deadlines. */
export default async function AdminResearchProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content")) redirect("/admin");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);
  const where = q ? { OR: [{ titleBn: { contains: q } }, { titleEn: { contains: q } }] } : undefined;

  const [total, projects] = await Promise.all([
    db.researchProject.count({ where }),
    db.researchProject.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { progress: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        titleBn: true,
        progress: true,
        statusBn: true,
        isCallForPapers: true,
        deadline: true,
        isPublished: true,
      },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <FlaskConical aria-hidden className="h-6 w-6 text-primary" />
            গবেষণা প্রকল্প
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            চলমান গবেষণাসমূহ — অগ্রগতি, কল-ফর-পেপার্স ও ডেডলাইন এখান থেকেই নিয়ন্ত্রিত।
          </p>
        </div>
        <Link
          href="/admin/research/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus aria-hidden className="h-4 w-4" />
          নতুন প্রকল্প
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/research/projects" method="get">
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

      {projects.length === 0 ? (
        <div className="mt-4 rounded-2xl border bg-card px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold">কোনো গবেষণা প্রকল্প নেই</p>
          <p className="mt-1 text-sm text-muted-foreground">প্রথম প্রকল্পটি যোগ করুন।</p>
          <Link
            href="/admin/research/projects/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus aria-hidden className="h-4 w-4" />
            প্রকল্প যোগ করুন
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/admin/research/projects/${project.id}`}
              className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-gold/50"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold leading-snug" dir="auto">
                  {project.titleBn}
                </p>
                {project.isCallForPapers && (
                  <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[10.5px] font-bold text-gold">কল ফর পেপার্স</span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className={cn("h-full rounded-full", project.progress >= 80 ? "bg-primary" : "bg-primary/60")}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="shrink-0 text-[11.5px] font-bold text-primary">{formatNumber(project.progress, "bn")}%</span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground">
                <span className={cn("font-semibold", project.isPublished ? "text-primary" : "")}>
                  {project.isPublished ? "প্রকাশিত" : "ড্রাফট"}
                </span>
                {project.statusBn ? <span>{project.statusBn}</span> : null}
                {project.deadline ? <span>শেষ তারিখ: {formatDate(project.deadline, "bn")}</span> : null}
              </div>
            </Link>
          ))}
        </div>
      )}

      <AdminPager
        page={page}
        pageCount={pageCount}
        total={total}
        unit="প্রকল্প"
        buildHref={(next) => buildQuery({ q: q || undefined }, next)}
      />
    </div>
  );
}
