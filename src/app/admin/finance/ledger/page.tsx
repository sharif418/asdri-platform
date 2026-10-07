import Link from "next/link";
import { redirect } from "next/navigation";
import { Landmark, Plus, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AdminPager } from "@/components/admin/admin-pager";
import { LedgerTable, type LedgerRowData } from "@/components/admin/ledger-table";
import { LedgerDialog } from "@/components/admin/ledger-dialog";
import { FinanceExportButton } from "@/components/admin/finance-export-button";
import { formatTaka, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LedgerDirection, Prisma } from "@prisma/client";

export const metadata = { title: "ম্যানুয়াল লেজার" };

const PAGE_SIZE = 50;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Manual ledger — the office's own bookkeeping (utility bills, book
 * purchases, zakat disbursements) alongside donation income. The per-fund
 * running balance at the top = Σ COMPLETED donations + Σ manual INCOME −
 * Σ manual EXPENSE.
 */
export default async function AdminLedgerPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "finance.manage")) redirect("/admin");

  const sp = await searchParams;
  const fundId = typeof sp.fundId === "string" && sp.fundId.length > 0 ? sp.fundId : undefined;
  const direction =
    typeof sp.direction === "string" && (sp.direction === "INCOME" || sp.direction === "EXPENSE") ? (sp.direction as LedgerDirection) : undefined;
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const where: Prisma.ManualLedgerEntryWhereInput = {
    ...(fundId ? { fundId } : {}),
    ...(direction ? { direction } : {}),
  };

  const [funds, rows, total, manualIncome, manualExpense, donationIncome] = await Promise.all([
    db.fund.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameBn: true, isEnabled: true } }),
    db.manualLedgerEntry.findMany({
      where,
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        fundId: true,
        direction: true,
        amount: true,
        description: true,
        entryDate: true,
        attachmentMediaId: true,
        fund: { select: { nameBn: true } },
        createdBy: { select: { name: true } },
      },
    }),
    db.manualLedgerEntry.count({ where }),
    db.manualLedgerEntry.groupBy({ by: ["fundId"], where: { direction: "INCOME" }, _sum: { amount: true } }),
    db.manualLedgerEntry.groupBy({ by: ["fundId"], where: { direction: "EXPENSE" }, _sum: { amount: true } }),
    db.donation.groupBy({ by: ["fundId"], where: { status: "COMPLETED" }, _sum: { amount: true } }),
  ]);

  // ManualLedgerEntry.attachmentMediaId is a plain FK without a Prisma relation
  // (schema gap, reported in the worklog) — attachments are joined manually.
  const attachmentIds = [...new Set(rows.map((row) => row.attachmentMediaId).filter((id): id is string => id !== null))];
  const attachments = attachmentIds.length
    ? await db.media.findMany({ where: { id: { in: attachmentIds } }, select: { id: true, filename: true, key: true, width: true, height: true, size: true } })
    : [];
  const attachmentMap = new Map(attachments.map((media) => [media.id, media]));

  const incomeMap = new Map(manualIncome.map((r) => [r.fundId, r._sum.amount ?? 0]));
  const expenseMap = new Map(manualExpense.map((r) => [r.fundId, r._sum.amount ?? 0]));
  const donationMap = new Map(donationIncome.map((r) => [r.fundId, r._sum.amount ?? 0]));

  const balances = funds.map((fund) => {
    const donations = donationMap.get(fund.id) ?? 0;
    const income = incomeMap.get(fund.id) ?? 0;
    const expense = expenseMap.get(fund.id) ?? 0;
    return { fund, donations, income, expense, balance: donations + income - expense };
  });
  const grandBalance = balances.reduce((sum, b) => sum + b.balance, 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const entries: LedgerRowData[] = rows.map((row) => ({
    id: row.id,
    fundId: row.fundId,
    fundNameBn: row.fund.nameBn,
    direction: row.direction,
    amount: row.amount,
    description: row.description,
    entryDate: row.entryDate.toISOString(),
    attachment: row.attachmentMediaId ? attachmentMap.get(row.attachmentMediaId) ?? null : null,
    createdByName: row.createdBy?.name ?? null,
  }));

  function pageHref(next: number): string {
    const params = new URLSearchParams();
    if (fundId) params.set("fundId", fundId);
    if (direction) params.set("direction", direction);
    params.set("page", String(next));
    return `/admin/finance/ledger?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/finance" className="hover:text-primary">
          আর্থিক বিভাগ
        </Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">ম্যানুয়াল লেজার</span>
      </nav>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <Landmark aria-hidden className="h-6 w-6 text-primary" />
            ম্যানুয়াল লেজার
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            অফিসের আয়-ব্যয়ের বই — মোট {formatNumber(total, "bn")} এন্ট্রি। প্রতিটি ফান্ডের চলতি ব্যালেন্স নিচে সারসংক্ষেপে।
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <FinanceExportButton endpoint="/api/admin/ledger/export" fallbackName="asdri-manual-ledger" filters={{ fundId, direction: direction ?? undefined }} />
          <LedgerDialog
            mode="create"
            funds={funds}
            initial={{
              fundId: funds[0]?.id ?? "",
              direction: "EXPENSE",
              amount: "",
              description: "",
              entryDate: new Date().toISOString().slice(0, 10),
              attachment: null,
            }}
            trigger={
              <Button className="gap-2 font-semibold">
                <Plus aria-hidden className="h-4 w-4" />
                নতুন এন্ট্রি
              </Button>
            }
          />
        </div>
      </div>

      {/* Per-fund running balance */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-gold/40 bg-gold/[0.07] p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-gold">
            <Wallet aria-hidden className="h-4 w-4" />
            সর্বমোট চলতি ব্যালেন্স
          </p>
          <p className="font-heading mt-2 text-xl font-bold">{formatTaka(grandBalance, "bn")}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">অনুদান + আয় − ব্যয়</p>
        </div>
        {balances.map(({ fund, donations, income, expense, balance }) => (
          <div key={fund.id} className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="truncate text-[12.5px] font-semibold">
              {fund.nameBn}
              {!fund.isEnabled && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[9.5px] font-bold text-muted-foreground">নিষ্ক্রিয়</span>}
            </p>
            <p className={cn("font-heading mt-1.5 text-lg font-bold", balance < 0 && "text-destructive")}>{formatTaka(balance, "bn")}</p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
              অনুদান {formatTaka(donations, "bn")} · আয় {formatTaka(income, "bn")} · ব্যয় {formatTaka(expense, "bn")}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form className="mt-6 flex flex-wrap gap-2" action="/admin/finance/ledger" method="get">
        <select name="fundId" defaultValue={fundId ?? ""} className="rounded-lg border bg-card px-3 py-2 text-sm" aria-label="ফান্ড ফিল্টার">
          <option value="">সব ফান্ড</option>
          {funds.map((fund) => (
            <option key={fund.id} value={fund.id}>
              {fund.nameBn}
            </option>
          ))}
        </select>
        <select name="direction" defaultValue={direction ?? ""} className="rounded-lg border bg-card px-3 py-2 text-sm" aria-label="আয়/ব্যয় ফিল্টার">
          <option value="">আয় ও ব্যয় উভয়</option>
          <option value="INCOME">শুধু আয়</option>
          <option value="EXPENSE">শুধু ব্যয়</option>
        </select>
        <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
          ফিল্টার
        </button>
      </form>

      <div className="mt-4">
        <LedgerTable entries={entries} funds={funds} />
      </div>

      <AdminPager
        page={page}
        pageCount={pageCount}
        total={total}
        unit="এন্ট্রি"
        buildHref={pageHref}
      />
    </div>
  );
}
