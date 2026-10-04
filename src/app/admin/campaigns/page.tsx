import { db } from "@/lib/db";
import { getLang } from "@/lib/i18n-server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CampaignBoard } from "@/components/admin/campaign-board";
import type { AdminCampaignData } from "@/components/admin/admin-types";

export const metadata = { title: "ক্যাম্পেইন ব্যবস্থাপনা" };

/** /admin/campaigns — funding-campaign board with donation aggregates (admin-only via layout). */
export default async function AdminCampaignsPage() {
  const lang = await getLang();
  const bn = lang === "bn";

  const [campaigns, allGrouped, completedGrouped] = await Promise.all([
    db.fundingCampaign.findMany({ orderBy: [{ active: "desc" }, { createdAt: "desc" }] }),
    db.donationIntent.groupBy({
      by: ["campaignId"],
      where: { campaignId: { not: null } },
      _count: { _all: true },
    }),
    db.donationIntent.groupBy({
      by: ["campaignId"],
      where: { campaignId: { not: null }, status: "completed" },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  const totalCounts = new Map<string, number>();
  for (const row of allGrouped) {
    if (row.campaignId) totalCounts.set(row.campaignId, row._count._all);
  }
  const completed = new Map<string, { count: number; sum: number }>();
  for (const row of completedGrouped) {
    if (row.campaignId) {
      completed.set(row.campaignId, { count: row._count._all, sum: row._sum.amount ?? 0 });
    }
  }

  const wire: AdminCampaignData[] = campaigns.map((campaign) => {
    const done = completed.get(campaign.id);
    return {
      id: campaign.id,
      slug: campaign.slug,
      titleBn: campaign.titleBn,
      titleEn: campaign.titleEn,
      descriptionBn: campaign.descriptionBn,
      descriptionEn: campaign.descriptionEn,
      targetAmount: campaign.targetAmount,
      raisedAmount: campaign.raisedAmount,
      currency: campaign.currency,
      deadline: campaign.deadline ? campaign.deadline.toISOString() : null,
      active: campaign.active,
      createdAt: campaign.createdAt.toISOString(),
      stats: {
        completedCount: done?.count ?? 0,
        completedSum: done?.sum ?? 0,
        totalCount: totalCounts.get(campaign.id) ?? 0,
      },
    };
  });

  return (
    <>
      <AdminPageHeader
        eyebrow={bn ? "সহযোগিতা" : "Stewardship"}
        title={bn ? "ক্যাম্পেইন ব্যবস্থাপনা" : "Campaign Management"}
        description={
          bn
            ? "ফান্ডরাইজিং ক্যাম্পেইনের লক্ষ্য, সংগৃহীত অর্থ, সময়সীমা ও সক্রিয় অবস্থা — অনুদানের হিসাবসহ এক জায়গায়।"
            : "Fundraising campaign targets, raised amounts, deadlines, and active state — with donation totals in one place."
        }
      />
      <CampaignBoard campaigns={wire} lang={lang} />
    </>
  );
}
