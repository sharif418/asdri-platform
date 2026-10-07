import Link from "next/link";
import { BadgeCheck, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatNumber } from "@/lib/format";
import { auditActionLabelBn, auditEntityLabelBn } from "@/lib/audit-labels";
import { cn } from "@/lib/utils";

export const metadata = { title: "অডিট লগ" };

const PAGE_SIZE = 50;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Audit log — every mutation: who, what, when, from where. (ADMIN only) */
export default async function AdminAuditPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "audit")) redirect("/admin");

  const sp = await searchParams;
  const entity = typeof sp.entity === "string" ? sp.entity.trim().slice(0, 60) : "";
  const action = typeof sp.action === "string" ? sp.action.trim().slice(0, 60) : "";
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const where = {
    ...(entity ? { entity } : {}),
    ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
  };

  const [total, entities, rows] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({ distinct: ["entity"], orderBy: { entity: "asc" }, select: { entity: true } }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        ip: true,
        createdAt: true,
        diff: true,
        actor: { select: { name: true } },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const exportParams = new URLSearchParams();
  if (entity) exportParams.set("entity", entity);
  if (action) exportParams.set("action", action);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <BadgeCheck aria-hidden className="h-6 w-6 text-primary" />
            অডিট লগ
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            প্রতিটি পরিবর্তনের হিসাব — কে, কখন, কী বদলেছেন, কোথা থেকে। সারিতে ক্লিক করলে পরিবর্তনের বিস্তারিত দেখা যায়।
          </p>
        </div>
        <a
          href={`/api/admin/audit/export${exportParams.size > 0 ? `?${exportParams.toString()}` : ""}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Download aria-hidden className="h-4 w-4" />
          CSV এক্সপোর্ট
        </a>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/audit" method="get">
        <select name="entity" defaultValue={entity} className="rounded-lg border bg-card px-3 py-2 text-sm">
          <option value="">সব এনটিটি</option>
          {entities.map((row) => (
            <option key={row.entity} value={row.entity}>
              {auditEntityLabelBn(row.entity)}
            </option>
          ))}
        </select>
        <input
          name="action"
          defaultValue={action}
          placeholder="অ্যাকশন দিয়ে খুঁজুন (যেমন notice.create)"
          dir="ltr"
          className="min-w-52 flex-1 rounded-lg border bg-card px-3.5 py-2 text-sm outline-none focus:border-primary/50"
        />
        <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
          <Search aria-hidden className="mr-1 inline h-3.5 w-3.5" />
          ফিল্টার
        </button>
      </form>

      <div className="mt-4 overflow-x-auto overflow-y-clip rounded-2xl border bg-card shadow-sm">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-heading text-lg font-bold">কোনো লগ পাওয়া যায়নি</p>
            <p className="mt-1 text-sm text-muted-foreground">ফিল্টার বদলে আবার দেখুন।</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">সময়</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">কর্তা</th>
                <th className="px-4 py-3 font-semibold">অ্যাকশন</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">এনটিটি</th>
                <th className="hidden px-4 py-3 font-semibold xl:table-cell">আইপি</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id} className="group align-top transition-colors hover:bg-secondary/20">
                  <td colSpan={5} className="p-0">
                    <details className="group/row">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-0 px-4 py-3 [&::-webkit-details-marker]:hidden">
                        <span className="w-40 shrink-0 text-[12px] text-muted-foreground">
                          {row.createdAt.toLocaleString("bn-BD")}
                        </span>
                        <span className="hidden w-32 shrink-0 truncate text-[12.5px] font-medium md:block">
                          {row.actor?.name ?? "সিস্টেম"}
                        </span>
                        <span
                          className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary"
                          title={row.action}
                        >
                          {auditActionLabelBn(row.action)}
                        </span>
                        <span
                          className="hidden shrink-0 text-[12px] text-muted-foreground lg:block"
                          title={row.entity}
                        >
                          {auditEntityLabelBn(row.entity)}
                          {row.entityId ? <span dir="ltr"> · {row.entityId.slice(-8)}</span> : ""}
                        </span>
                        <span className="hidden shrink-0 text-[11.5px] text-muted-foreground xl:block" dir="ltr">
                          {row.ip ?? "—"}
                        </span>
                        <span aria-hidden className="ml-auto shrink-0 text-muted-foreground transition-transform group-open/row:rotate-90">›</span>
                      </summary>
                      <div className="border-t bg-background/40 px-4 py-3">
                        {row.diff ? (
                          <pre
                            className="scrollbar-thin max-h-64 overflow-auto rounded-lg border bg-card p-3 text-[11.5px] leading-relaxed"
                            dir="ltr"
                          >
                            {JSON.stringify(row.diff, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-[12.5px] text-muted-foreground">এই এন্ট্রিতে কোনো diff সংরক্ষিত হয়নি।</p>
                        )}
                        {row.entityId && (
                          <p className="mt-2 text-[11px] text-muted-foreground" dir="ltr">
                            এনটিটি আইডি: <code className="rounded bg-secondary px-1">{row.entityId}</code>
                          </p>
                        )}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            পৃষ্ঠা {formatNumber(page, "bn")} / {formatNumber(pageCount, "bn")} · মোট {formatNumber(total, "bn")} এন্ট্রি
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/audit?${new URLSearchParams({ ...(entity ? { entity } : {}), ...(action ? { action } : {}), page: String(page - 1) }).toString()}`}
                className="inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 font-semibold hover:bg-secondary"
              >
                <ChevronLeft aria-hidden className="h-3.5 w-3.5" /> পূর্ববর্তী
              </Link>
            )}
            {page < pageCount && (
              <Link
                href={`/admin/audit?${new URLSearchParams({ ...(entity ? { entity } : {}), ...(action ? { action } : {}), page: String(page + 1) }).toString()}`}
                className={cn("inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 font-semibold hover:bg-secondary")}
              >
                পরবর্তী <ChevronRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
