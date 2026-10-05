import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const fundCreateSchema = z.object({
  key: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z][a-z0-9-]{1,30}$/, "কী ছোট হাতের ইংরেজি অক্ষর/সংখ্যা/হাইফেন দিয়ে দিন (যেমন: emergency-relief)"),
  nameBn: z.string().trim().min(2, "নাম (বাংলা) দিন").max(120),
  nameEn: z.string().trim().max(120).default(""),
  descriptionBn: z.string().trim().max(1000).default(""),
  descriptionEn: z.string().trim().max(1000).default(""),
  isDefault: z.boolean().default(false),
  isEnabled: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

function zodFields(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(error.issues.map((i) => [i.path.join("."), i.message]));
}

/** POST /api/admin/funds — create a fund (ADMIN, FINANCE). The key is immutable after creation. */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "finance");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = fundCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "যাচাই করুন।", fields: zodFields(parsed.error) }, { status: 400 });
  }

  const d = parsed.data;
  const clash = await db.fund.findUnique({ where: { key: d.key } });
  if (clash) {
    return NextResponse.json({ ok: false, error: "এই কী-এর ফান্ড আগেই আছে।", fields: { key: "কী ডুপ্লিকেট" } }, { status: 409 });
  }

  // Only one fund may carry the default flag.
  if (d.isDefault) {
    await db.fund.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  }

  const fund = await db.fund.create({ data: d });
  await audit(guard.session.user.id, "fund.create", "Fund", fund.id, { after: { key: fund.key, nameBn: fund.nameBn, isEnabled: fund.isEnabled } }, request.headers.get("x-real-ip"));
  return NextResponse.json({ ok: true, data: { id: fund.id } }, { status: 201 });
}
