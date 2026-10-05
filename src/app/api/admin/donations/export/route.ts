import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/** GET /api/admin/donations/export — CSV of the filtered donations ledger. */
export async function GET(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "finance");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const fundId = url.searchParams.get("fundId") || undefined;
  const month = url.searchParams.get("month") || undefined; // yyyy-mm

  // Month filter: entries created within that calendar month.
  const createdAt: Prisma.DateTimeFilter | undefined = (() => {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) return undefined;
    const start = new Date(`${month}-01T00:00:00Z`);
    if (Number.isNaN(start.getTime())) return undefined;
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    return { gte: start, lt: end };
  })();

  const where: Prisma.DonationWhereInput = {
    ...(status ? { status: status as never } : {}),
    ...(fundId ? { fundId } : {}),
    ...(createdAt ? { createdAt } : {}),
  };

  const rows = await db.donation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { fund: { select: { nameBn: true } }, campaign: { select: { titleBn: true } } },
  });

  const header = [
    "রিসিপ্ট নম্বর",
    "ট্র্যাকিং কোড",
    "ফান্ড",
    "ক্যাম্পেইন",
    "পরিমাণ (৳)",
    "মুদ্রা",
    "দাতার নাম",
    "গোপন",
    "ইমেইল",
    "মোবাইল",
    "স্ট্যাটাস",
    "তৈরির তারিখ",
    "পরিশোধের তারিখ",
  ];
  const csvEscape = (value: string | number | null | undefined): string => {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.receiptNo ?? "",
        row.trackingCode,
        row.fund.nameBn,
        row.campaign?.titleBn ?? "",
        row.amount,
        row.currency,
        row.donorName,
        row.isAnonymous ? "হ্যাঁ" : "না",
        row.donorEmail ?? "",
        row.donorPhone ?? "",
        row.status,
        row.createdAt.toISOString().slice(0, 10),
        row.paidAt ? row.paidAt.toISOString().slice(0, 10) : "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  const csv = "\uFEFF" + lines.join("\r\n");
  await audit(guard.session.user.id, "donation.export", "Donation", null, { after: { rows: rows.length, status: status ?? null, fundId: fundId ?? null, month: month ?? null } }, request.headers.get("x-real-ip"));
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="asdri-donations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
