import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/** GET /api/admin/ledger/export — CSV of manual ledger entries (per-fund bookkeeping). */
export async function GET(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "finance");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const url = new URL(request.url);
  const fundId = url.searchParams.get("fundId") || undefined;
  const direction = url.searchParams.get("direction") || undefined;

  const where: Prisma.ManualLedgerEntryWhereInput = {
    ...(fundId ? { fundId } : {}),
    ...(direction === "INCOME" || direction === "EXPENSE" ? { direction } : {}),
  };

  const rows = await db.manualLedgerEntry.findMany({
    where,
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    include: { fund: { select: { nameBn: true } }, createdBy: { select: { name: true } } },
  });

  const header = ["তারিখ", "ফান্ড", "খাত", "আয়/ব্যয়", "পরিমাণ (৳)", "সংযুক্তি", "এন্ট্রি দিয়েছেন"];
  const csvEscape = (value: string | number | null | undefined): string => {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.entryDate.toISOString().slice(0, 10),
        row.fund.nameBn,
        row.description,
        row.direction === "INCOME" ? "আয়" : "ব্যয়",
        row.direction === "EXPENSE" ? -row.amount : row.amount,
        row.attachmentMediaId ? "আছে" : "",
        row.createdBy?.name ?? "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  const csv = "\uFEFF" + lines.join("\r\n");
  await audit(guard.session.user.id, "ledger.export", "ManualLedgerEntry", null, { after: { rows: rows.length } }, request.headers.get("x-real-ip"));
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="asdri-manual-ledger-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
