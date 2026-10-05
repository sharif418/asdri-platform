import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { OutboxTable, type OutboxRowData } from "@/components/admin/outbox-table";
import { formatNumber, toBnDigits } from "@/lib/format";

export const metadata = { title: "আউটবক্স" };

const PAGE_SIZE = 25;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Outbox email viewer — every queued/sent email with a safe rendered preview. */
export default async function AdminOutboxPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "finance")) redirect("/admin");

  const sp = await searchParams;
  const kind = typeof sp.kind === "string" && sp.kind.length > 0 ? sp.kind : undefined;
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const where = kind ? { kind } : {};
  const [total, queued, rows, kinds] = await Promise.all([
    db.outboxEmail.count({ where }),
    db.outboxEmail.count({ where: { ...where, sentAt: null } }),
    db.outboxEmail.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, kind: true, to: true, subject: true, body: true, html: true, attempts: true, sentAt: true, error: true, createdAt: true },
    }),
    db.outboxEmail.groupBy({ by: ["kind"], _count: { _all: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const emails: OutboxRowData[] = rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    to: row.to,
    subject: row.subject,
    body: row.body,
    html: row.html,
    attempts: row.attempts,
    sentAt: row.sentAt?.toISOString() ?? null,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
  }));

  function pageHref(next: number): string {
    const params = new URLSearchParams();
    if (kind) params.set("kind", kind);
    params.set("page", String(next));
    return `/admin/finance/outbox?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/finance" className="hover:text-primary">
          আর্থিক বিভাগ
        </Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">আউটবক্স</span>
      </nav>
      <div className="mt-2">
        <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
          <Mail aria-hidden className="h-6 w-6 text-primary" />
          আউটবক্স
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          মোট {formatNumber(total, "bn")} ইমেইল · কিউতে {toBnDigits(queued)} টি — MAIL_DRIVER=log হলে পাঠানোর রেকর্ড হিসেবে এখানেই জমা থাকে, smtp ড্রাইভারে সরাসরি পাঠানো হয়। ব্যর্থ/কিউতে থাকা সারিতে “এখনই আবার পাঠান” দিয়ে সরাসরি ডেলিভারি চেষ্টা করা যায়।
        </p>
      </div>

      {kinds.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2 text-[11.5px] font-semibold">
          <Link
            href="/admin/finance/outbox"
            className={`inline-flex items-center rounded-full px-3 py-1 ${!kind ? "bg-primary text-primary-foreground" : "bg-gold/15 text-gold"}`}
          >
            সব ধরন <span className="font-bold">{formatNumber(total, "bn")}</span>
          </Link>
          {kinds.map((row) => (
            <Link
              key={row.kind}
              href={`/admin/finance/outbox?kind=${encodeURIComponent(row.kind)}`}
              className={`inline-flex items-center rounded-full px-3 py-1 transition-opacity ${kind === row.kind ? "bg-primary/10 text-primary" : "opacity-75 hover:opacity-100"}`}
            >
              <span className="font-mono text-[10.5px]">{row.kind}</span> <span className="font-bold">{formatNumber(row._count._all, "bn")}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4">
        <OutboxTable emails={emails} />
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            পৃষ্ঠা {formatNumber(page, "bn")} / {formatNumber(pageCount, "bn")} · মোট {formatNumber(total, "bn")} ইমেইল
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="inline-flex items-center rounded-lg border bg-card px-3 py-1.5 font-semibold hover:bg-secondary">
                পূর্ববর্তী
              </Link>
            )}
            {page < pageCount && (
              <Link href={pageHref(page + 1)} className="inline-flex items-center rounded-lg border bg-card px-3 py-1.5 font-semibold hover:bg-secondary">
                পরবর্তী
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
