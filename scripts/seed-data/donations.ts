import type { PrismaClient } from "@prisma/client";

/**
 * Round-9 insights seed (restored round-8 module): an idempotent half-year
 * donation history so the dashboard's 6-month trend chart has reality on day
 * one. trackingCode-keyed (re-running refreshes amounts/dates in place —
 * relative months-ago anchors keep the chart current no matter when the seed
 * runs). PENDING never trends, so the one PENDING row proves the rule.
 * The office's manual ledger is untouched — these are gateway donations only.
 */

interface DonationSeedRow {
  trackingCode: string;
  monthsAgo: number; // 0 = current month
  dayOfMonth: number;
  amount: number;
  donorName: string;
  isAnonymous: boolean;
  donorEmail?: string;
  status: "COMPLETED" | "PENDING";
  fundKey: string;
}

const DONATION_SEED: DonationSeedRow[] = [
  // five months ago — the quiet month
  { trackingCode: "DN-SEED-0501", monthsAgo: 5, dayOfMonth: 6, amount: 5000, donorName: "আনোয়ার হোসাইন", isAnonymous: false, status: "COMPLETED", fundKey: "general" },
  { trackingCode: "DN-SEED-0502", monthsAgo: 5, dayOfMonth: 19, amount: 2500, donorName: "পরিচিত দাতা", isAnonymous: true, status: "COMPLETED", fundKey: "zakat" },
  // four months ago
  { trackingCode: "DN-SEED-0401", monthsAgo: 4, dayOfMonth: 3, amount: 10000, donorName: "মোঃ শফিকুল ইসলাম", isAnonymous: false, status: "COMPLETED", fundKey: "general" },
  { trackingCode: "DN-SEED-0402", monthsAgo: 4, dayOfMonth: 12, amount: 15000, donorName: "আব্দুল কাদির", isAnonymous: false, donorEmail: "donor.seed@example.org", status: "COMPLETED", fundKey: "construction" },
  // three months ago — Ramadan-adjacent spike
  { trackingCode: "DN-SEED-0301", monthsAgo: 3, dayOfMonth: 2, amount: 20000, donorName: "হাফেজ মুহাম্মাদ আসলাম", isAnonymous: false, status: "COMPLETED", fundKey: "zakat" },
  { trackingCode: "DN-SEED-0302", monthsAgo: 3, dayOfMonth: 9, amount: 12000, donorName: "আনোয়ার হোসাইন", isAnonymous: false, status: "COMPLETED", fundKey: "general" },
  { trackingCode: "DN-SEED-0303", monthsAgo: 3, dayOfMonth: 21, amount: 8000, donorName: "পরিচিত দাতা", isAnonymous: true, status: "COMPLETED", fundKey: "zakat" },
  { trackingCode: "DN-SEED-0304", monthsAgo: 3, dayOfMonth: 27, amount: 35000, donorName: "রহিমা বেগম", isAnonymous: false, status: "COMPLETED", fundKey: "construction" },
  // two months ago
  { trackingCode: "DN-SEED-0201", monthsAgo: 2, dayOfMonth: 5, amount: 7000, donorName: "মোঃ শফিকুল ইসলাম", isAnonymous: false, status: "COMPLETED", fundKey: "general" },
  { trackingCode: "DN-SEED-0202", monthsAgo: 2, dayOfMonth: 14, amount: 45000, donorName: "আব্দুল কাদির", isAnonymous: false, status: "COMPLETED", fundKey: "construction" },
  { trackingCode: "DN-SEED-0203", monthsAgo: 2, dayOfMonth: 23, amount: 10000, donorName: "সাইফুল ইসলাম", isAnonymous: false, status: "COMPLETED", fundKey: "education" },
  // last month
  { trackingCode: "DN-SEED-0101", monthsAgo: 1, dayOfMonth: 7, amount: 6000, donorName: "আনোয়ার হোসাইন", isAnonymous: false, status: "COMPLETED", fundKey: "general" },
  { trackingCode: "DN-SEED-0102", monthsAgo: 1, dayOfMonth: 18, amount: 30000, donorName: "হাফেজ মুহাম্মাদ আসলাম", isAnonymous: false, status: "COMPLETED", fundKey: "zakat" },
  // this month — one completed, one pending (PENDING never trends)
  { trackingCode: "DN-SEED-0001", monthsAgo: 0, dayOfMonth: 4, amount: 18000, donorName: "মোঃ শফিকুল ইসলাম", isAnonymous: false, status: "COMPLETED", fundKey: "education" },
  { trackingCode: "DN-SEED-0002", monthsAgo: 0, dayOfMonth: 8, amount: 22000, donorName: "নতুন দাতা", isAnonymous: true, status: "PENDING", fundKey: "general" },
];

function dateMonthsAgo(monthsAgo: number, dayOfMonth: number): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, Math.min(dayOfMonth, 28), 10, 0, 0));
  return d;
}

export async function seedDonations(db: PrismaClient): Promise<void> {
  const funds = await db.fund.findMany({ select: { id: true, key: true } });
  const fundByKey = new Map(funds.map((fund) => [fund.key, fund.id]));
  const fallbackFundId = fundByKey.get("general") ?? funds[0]?.id;
  if (!fallbackFundId) return; // no funds seeded yet — nothing to attach to

  let receiptSeq = 901;
  for (const row of DONATION_SEED) {
    const paidAt = dateMonthsAgo(row.monthsAgo, row.dayOfMonth);
    const data = {
      fundId: fundByKey.get(row.fundKey) ?? fallbackFundId,
      amount: row.amount,
      donorName: row.donorName,
      isAnonymous: row.isAnonymous,
      donorEmail: row.donorEmail ?? null,
      donorAddress: "",
      status: row.status,
      provider: "sandbox",
      paidAt: row.status === "COMPLETED" ? paidAt : null,
      createdAt: paidAt,
      updatedAt: paidAt,
      receiptNo: row.status === "COMPLETED" ? `ASDRI-R-SEED${String(receiptSeq).padStart(4, "0")}` : null,
      receiptSentAt: row.status === "COMPLETED" ? paidAt : null,
    };
    receiptSeq += 1;
    const existing = await db.donation.findUnique({ where: { trackingCode: row.trackingCode } });
    if (existing) {
      await db.donation.update({ where: { trackingCode: row.trackingCode }, data });
    } else {
      await db.donation.create({ data: { trackingCode: row.trackingCode, ...data } });
    }
  }
  console.log(`  ✓ donation history seeded (${DONATION_SEED.length} rows, 6 months)`);
}
