import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const ledgerCreateSchema = z.object({
  fundId: z.string().min(1, "ফান্ড নির্বাচন করুন"),
  direction: z.enum(["INCOME", "EXPENSE"], { message: "আয় না ব্যয় নির্বাচন করুন" }),
  amount: z.number({ message: "পরিমাণ দিন" }).int("পূর্ণ সংখ্যা দিন (টাকা)").min(1, "সর্বনিম্ন ১ টাকা").max(100000000, "পরিমাণটি অতিরিক্ত বড়"),
  description: z.string().trim().min(2, "খাতের বিবরণ দিন").max(300),
  entryDate: z.string().datetime({ message: "তারিখ দিন" }),
  attachmentMediaId: z.string().min(1).nullable().optional(),
});

function zodFields(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(error.issues.map((i) => [i.path.join("."), i.message]));
}

/**
 * POST /api/admin/ledger — record a manual bookkeeping entry (INCOME/EXPENSE
 * per fund): office utility bills, book purchases, zakat disbursements — the
 * office's own ledger alongside donation income.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "finance");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = ledgerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "যাচাই করুন।", fields: zodFields(parsed.error) }, { status: 400 });
  }

  const d = parsed.data;
  const fund = await db.fund.findUnique({ where: { id: d.fundId } });
  if (!fund) return NextResponse.json({ ok: false, error: "ফান্ড পাওয়া যায়নি।" }, { status: 404 });

  const entry = await db.manualLedgerEntry.create({
    data: {
      fundId: d.fundId,
      direction: d.direction,
      amount: d.amount,
      description: d.description,
      entryDate: new Date(d.entryDate),
      attachmentMediaId: d.attachmentMediaId || null,
      createdById: guard.session.user.id,
    },
  });
  await audit(
    guard.session.user.id,
    "ledger.create",
    "ManualLedgerEntry",
    entry.id,
    { after: { direction: entry.direction, amount: entry.amount, fund: fund.key, description: entry.description } },
    request.headers.get("x-real-ip"),
  );
  return NextResponse.json({ ok: true, data: { id: entry.id } }, { status: 201 });
}
