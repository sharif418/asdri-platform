import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Target } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CampaignsTable, type CampaignRowData } from "@/components/admin/campaigns-table";
import { CampaignDialog } from "@/components/admin/campaign-dialog";
import { formatNumber, toBnDigits } from "@/lib/format";

export const metadata = { title: "ক্যাম্পেইন" };

/** Campaigns manager — live raised sums, guarded delete, create/edit dialog. */
export default async function AdminCampaignsPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "finance.manage")) redirect("/admin");

  const [rows, funds, raisedRows, donorRows] = await Promise.all([
    db.campaign.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        titleBn: true,
        titleEn: true,
        descriptionBn: true,
        descriptionEn: true,
        goalAmount: true,
        startsAt: true,
        endsAt: true,
        isPublished: true,
        sortOrder: true,
        fundId: true,
        fund: { select: { nameBn: true } },
        coverMedia: { select: { id: true, filename: true, key: true, width: true, height: true } },
      },
    }),
    db.fund.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, key: true, nameBn: true } }),
    db.donation.groupBy({ by: ["campaignId"], where: { status: "COMPLETED", campaignId: { not: null } }, _sum: { amount: true } }),
    db.donation.groupBy({ by: ["campaignId"], where: { campaignId: { not: null } }, _count: { _all: true } }),
  ]);

  const raisedMap = new Map(raisedRows.map((r) => [r.campaignId, r._sum.amount ?? 0]));
  const donorMap = new Map(donorRows.map((r) => [r.campaignId, r._count._all]));

  const campaigns: CampaignRowData[] = rows.map((row) => ({
    id: row.id,
    titleBn: row.titleBn,
    titleEn: row.titleEn,
    descriptionBn: row.descriptionBn,
    descriptionEn: row.descriptionEn,
    fundId: row.fundId,
    fundNameBn: row.fund.nameBn,
    goalAmount: row.goalAmount,
    raised: raisedMap.get(row.id) ?? 0,
    donorCount: donorMap.get(row.id) ?? 0,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
    coverMedia: row.coverMedia,
  }));

  const published = campaigns.filter((c) => c.isPublished).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/finance" className="hover:text-primary">
          আর্থিক বিভাগ
        </Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">ক্যাম্পেইন</span>
      </nav>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <Target aria-hidden className="h-6 w-6 text-primary" />
            ক্যাম্পেইন
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            মোট {formatNumber(campaigns.length, "bn")} টি · প্রকাশিত {toBnDigits(published)} টি — সাপোর্ট পেজের অগ্রগতি বার এখানকার লক্ষ্যমাত্রা থেকে হিসাব হয়।
          </p>
        </div>
        {campaigns.length > 0 && (
          <CampaignDialog
            mode="create"
            funds={funds}
            initial={{
              titleBn: "",
              titleEn: "",
              descriptionBn: "",
              descriptionEn: "",
              goalAmount: "",
              fundId: funds[0]?.id ?? "",
              startsAt: "",
              endsAt: "",
              isPublished: true,
              sortOrder: "0",
              coverMedia: null,
            }}
            trigger={
              <Button className="gap-2 font-semibold">
                <Plus aria-hidden className="h-4 w-4" />
                নতুন ক্যাম্পেইন
              </Button>
            }
          />
        )}
      </div>

      <div className="mt-6">
        <CampaignsTable campaigns={campaigns} funds={funds} />
      </div>
    </div>
  );
}
