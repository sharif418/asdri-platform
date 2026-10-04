import { db } from "@/lib/db";
import { getLang } from "@/lib/i18n-server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DonationLedger } from "@/components/admin/donation-ledger";
import type { AdminDonationRow, DonationFundType, DonationStatus } from "@/components/admin/donation-ledger";

export const metadata = { title: "অনুদান খাতাবহি" };

/** /admin/donations — donation-intent ledger with totals (admin-only via layout). */
export default async function AdminDonationsPage() {
  const lang = await getLang();
  const bn = lang === "bn";

  const [rows, completedAgg, completedCount, initiatedCount] = await Promise.all([
    db.donationIntent.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { campaign: { select: { titleBn: true, titleEn: true } } },
    }),
    db.donationIntent.aggregate({ where: { status: "completed" }, _sum: { amount: true } }),
    db.donationIntent.count({ where: { status: "completed" } }),
    db.donationIntent.count({ where: { status: "initiated" } }),
  ]);

  const donations: AdminDonationRow[] = rows.map((row) => ({
    id: row.id,
    receiptNo: row.receiptNo,
    fundType: row.fundType as DonationFundType,
    amount: row.amount,
    currency: row.currency,
    donorName: row.donorName,
    email: row.email,
    phone: row.phone,
    anonymous: row.anonymous,
    studentRef: row.studentRef,
    recurring: row.recurring,
    message: row.message,
    status: row.status === "completed" ? "completed" : "initiated",
    campaignTitle: row.campaign ? (bn ? row.campaign.titleBn : row.campaign.titleEn) : null,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <>
      <AdminPageHeader
        eyebrow={bn ? "সহযোগিতা" : "Stewardship"}
        title={bn ? "অনুদান খাতাবহি" : "Donation Ledger"}
        description={
          bn
            ? "অনুদানের রসিদ ও তথ্যের পূর্ণ খাতা — খাত, পরিমাণ, দাতা ও ক্যাম্পেইন অনুযায়ী অনুসন্ধান করুন।"
            : "The full ledger of donation receipts — searchable by fund, amount, donor, and campaign."
        }
      />
      <DonationLedger
        rows={donations}
        lang={lang}
        totals={{
          completedAmount: completedAgg._sum.amount ?? 0,
          completedCount,
          initiatedCount,
        }}
      />
    </>
  );
}
