import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, PiggyBank } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { FundsTable, type FundRowData } from "@/components/admin/funds-table";
import { FundDialog } from "@/components/admin/fund-dialog";
import { formatNumber } from "@/lib/format";

export const metadata = { title: "ফান্ড" };

/** Funds manager — the donation pots (key immutable, enable/disable, guarded delete). */
export default async function AdminFundsPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "finance.manage")) redirect("/admin");

  const [rows, donationCounts, completedTotals, entryCounts] = await Promise.all([
    db.fund.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        key: true,
        nameBn: true,
        nameEn: true,
        descriptionBn: true,
        descriptionEn: true,
        isDefault: true,
        isEnabled: true,
        sortOrder: true,
      },
    }),
    db.donation.groupBy({ by: ["fundId"], _count: { _all: true } }),
    db.donation.groupBy({ by: ["fundId"], where: { status: "COMPLETED" }, _sum: { amount: true } }),
    db.manualLedgerEntry.groupBy({ by: ["fundId"], _count: { _all: true } }),
  ]);

  const donationMap = new Map(donationCounts.map((r) => [r.fundId, r._count._all]));
  const totalMap = new Map(completedTotals.map((r) => [r.fundId, r._sum.amount ?? 0]));
  const entryMap = new Map(entryCounts.map((r) => [r.fundId, r._count._all]));

  const funds: FundRowData[] = rows.map((row) => ({
    ...row,
    donationCount: donationMap.get(row.id) ?? 0,
    completedTotal: totalMap.get(row.id) ?? 0,
    entryCount: entryMap.get(row.id) ?? 0,
  }));

  const enabled = funds.filter((f) => f.isEnabled).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/finance" className="hover:text-primary">
          আর্থিক বিভাগ
        </Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">ফান্ড</span>
      </nav>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <PiggyBank aria-hidden className="h-6 w-6 text-primary" />
            ফান্ড
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            মোট {formatNumber(funds.length, "bn")} টি · সক্রিয় {formatNumber(enabled, "bn")} টি — নিষ্ক্রিয় ফান্ড সাপোর্ট পেজের ফান্ড কার্ডে দেখা যায় না।
          </p>
        </div>
        {funds.length > 0 && (
          <FundDialog
            mode="create"
            initial={{ key: "", nameBn: "", nameEn: "", descriptionBn: "", descriptionEn: "", isDefault: false, isEnabled: true, sortOrder: String(funds.length) }}
            trigger={
              <Button className="gap-2 font-semibold">
                <Plus aria-hidden className="h-4 w-4" />
                নতুন ফান্ড
              </Button>
            }
          />
        )}
      </div>

      <div className="mt-6">
        <FundsTable funds={funds} />
      </div>
    </div>
  );
}
