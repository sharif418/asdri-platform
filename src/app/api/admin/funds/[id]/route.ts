import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const fundPatchSchema = z
  .object({
    nameBn: z.string().trim().min(2, "নাম (বাংলা) দিন").max(120),
    nameEn: z.string().trim().max(120),
    descriptionBn: z.string().trim().max(1000),
    descriptionEn: z.string().trim().max(1000),
    isDefault: z.boolean(),
    isEnabled: z.boolean(),
    sortOrder: z.number().int().min(0).max(999),
  })
  .partial();

function zodFields(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(error.issues.map((i) => [i.path.join("."), i.message]));
}

/** PATCH /api/admin/funds/[id] — name/description/flags/order (key immutable). */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "finance");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.fund.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "ফান্ড পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = fundPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "যাচাই করুন।", fields: zodFields(parsed.error) }, { status: 400 });
  }

  const d = parsed.data;
  if (d.isDefault === true && !existing.isDefault) {
    await db.fund.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  }

  const fund = await db.fund.update({ where: { id }, data: d });

  await audit(
    guard.session.user.id,
    "fund.update",
    "Fund",
    id,
    { before: { nameBn: existing.nameBn, isEnabled: existing.isEnabled, isDefault: existing.isDefault }, after: { nameBn: fund.nameBn, isEnabled: fund.isEnabled, isDefault: fund.isDefault } },
    request.headers.get("x-real-ip"),
  );
  return NextResponse.json({ ok: true, data: { id: fund.id } });
}

/** DELETE /api/admin/funds/[id] — 409 when donations or ledger entries reference it. */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "finance");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.fund.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "ফান্ড পাওয়া যায়নি।" }, { status: 404 });

  const [donations, entries] = await Promise.all([
    db.donation.count({ where: { fundId: id } }),
    db.manualLedgerEntry.count({ where: { fundId: id } }),
  ]);
  if (donations > 0 || entries > 0) {
    return NextResponse.json(
      { ok: false, error: "এই ফান্ডে অনুদান বা লেজার এন্ট্রি আছে — মুছা যাবে না। নিষ্ক্রিয় করে দিন।" },
      { status: 409 },
    );
  }

  await db.fund.delete({ where: { id } });
  await audit(guard.session.user.id, "fund.delete", "Fund", id, { before: { key: existing.key, nameBn: existing.nameBn } }, request.headers.get("x-real-ip"));
  return NextResponse.json({ ok: true });
}
