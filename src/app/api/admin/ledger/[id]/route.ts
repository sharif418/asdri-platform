import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const ledgerPatchSchema = z
  .object({
    fundId: z.string().min(1),
    direction: z.enum(["INCOME", "EXPENSE"]),
    amount: z.number({ message: "পরিমাণ দিন" }).int("পূর্ণ সংখ্যা দিন (টাকা)").min(1, "সর্বনিম্ন ১ টাকা").max(100000000, "পরিমাণটি অতিরিক্ত বড়"),
    description: z.string().trim().min(2, "খাতের বিবরণ দিন").max(300),
    entryDate: z.string().datetime({ message: "তারিখ দিন" }),
    attachmentMediaId: z.string().min(1).nullable(),
  })
  .partial();

function zodFields(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(error.issues.map((i) => [i.path.join("."), i.message]));
}

/** PATCH /api/admin/ledger/[id] — edit a manual entry. */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "finance");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.manualLedgerEntry.findUnique({ where: { id }, include: { fund: { select: { key: true } } } });
  if (!existing) return NextResponse.json({ ok: false, error: "এন্ট্রি পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = ledgerPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "যাচাই করুন।", fields: zodFields(parsed.error) }, { status: 400 });
  }

  const d = parsed.data;
  if (d.fundId) {
    const fund = await db.fund.findUnique({ where: { id: d.fundId } });
    if (!fund) return NextResponse.json({ ok: false, error: "ফান্ড পাওয়া যায়নি।" }, { status: 404 });
  }

  const entry = await db.manualLedgerEntry.update({
    where: { id },
    data: {
      ...(d.fundId !== undefined ? { fundId: d.fundId } : {}),
      ...(d.direction !== undefined ? { direction: d.direction } : {}),
      ...(d.amount !== undefined ? { amount: d.amount } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.entryDate !== undefined ? { entryDate: new Date(d.entryDate) } : {}),
      ...(d.attachmentMediaId !== undefined ? { attachmentMediaId: d.attachmentMediaId || null } : {}),
    },
  });

  await audit(
    guard.session.user.id,
    "ledger.update",
    "ManualLedgerEntry",
    id,
    { before: { direction: existing.direction, amount: existing.amount, description: existing.description }, after: { direction: entry.direction, amount: entry.amount, description: entry.description } },
    request.headers.get("x-real-ip"),
  );
  return NextResponse.json({ ok: true, data: { id: entry.id } });
}

/** DELETE /api/admin/ledger/[id] — remove a manual entry (audited, reversible only by re-entry). */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "finance");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.manualLedgerEntry.findUnique({ where: { id }, include: { fund: { select: { key: true } } } });
  if (!existing) return NextResponse.json({ ok: false, error: "এন্ট্রি পাওয়া যায়নি।" }, { status: 404 });

  await db.manualLedgerEntry.delete({ where: { id } });
  await audit(
    guard.session.user.id,
    "ledger.delete",
    "ManualLedgerEntry",
    id,
    { before: { direction: existing.direction, amount: existing.amount, fund: existing.fund.key, description: existing.description } },
    request.headers.get("x-real-ip"),
  );
  return NextResponse.json({ ok: true });
}
