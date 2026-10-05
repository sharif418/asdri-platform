import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const campaignPatchSchema = z
  .object({
    titleBn: z.string().trim().min(2, "শিরোনাম (বাংলা) দিন").max(160),
    titleEn: z.string().trim().max(160),
    descriptionBn: z.string().trim().max(2000),
    descriptionEn: z.string().trim().max(2000),
    goalAmount: z.number({ message: "লক্ষ্য পরিমাণ দিন" }).int("পূর্ণ সংখ্যা দিন").min(1000, "সর্বনিম্ন ১০০০ টাকা").max(100000000, "পরিমাণটি অতিরিক্ত বড়"),
    fundId: z.string().min(1, "ফান্ড নির্বাচন করুন"),
    coverMediaId: z.string().min(1).nullable(),
    startsAt: z.string().datetime().nullable(),
    endsAt: z.string().datetime().nullable(),
    isPublished: z.boolean(),
    sortOrder: z.number().int().min(0).max(999),
  })
  .partial();

function zodFields(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(error.issues.map((i) => [i.path.join("."), i.message]));
}

/** PATCH /api/admin/campaigns/[id] — edit any subset of campaign fields. */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "finance");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.campaign.findUnique({ where: { id }, include: { fund: { select: { key: true } } } });
  if (!existing) return NextResponse.json({ ok: false, error: "ক্যাম্পেইন পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = campaignPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "যাচাই করুন।", fields: zodFields(parsed.error) }, { status: 400 });
  }

  const d = parsed.data;
  if (d.fundId && d.fundId !== existing.fundId) {
    const fund = await db.fund.findUnique({ where: { id: d.fundId } });
    if (!fund) return NextResponse.json({ ok: false, error: "ফান্ড পাওয়া যায়নি।" }, { status: 404 });
  }

  const campaign = await db.campaign.update({
    where: { id },
    data: {
      ...(d.titleBn !== undefined ? { titleBn: d.titleBn } : {}),
      ...(d.titleEn !== undefined ? { titleEn: d.titleEn } : {}),
      ...(d.descriptionBn !== undefined ? { descriptionBn: d.descriptionBn } : {}),
      ...(d.descriptionEn !== undefined ? { descriptionEn: d.descriptionEn } : {}),
      ...(d.goalAmount !== undefined ? { goalAmount: d.goalAmount } : {}),
      ...(d.fundId !== undefined ? { fundId: d.fundId } : {}),
      ...(d.coverMediaId !== undefined ? { coverMediaId: d.coverMediaId || null } : {}),
      ...(d.startsAt !== undefined ? { startsAt: d.startsAt ? new Date(d.startsAt) : null } : {}),
      ...(d.endsAt !== undefined ? { endsAt: d.endsAt ? new Date(d.endsAt) : null } : {}),
      ...(d.isPublished !== undefined ? { isPublished: d.isPublished } : {}),
      ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
    },
  });

  await audit(
    guard.session.user.id,
    "campaign.update",
    "Campaign",
    id,
    { before: { titleBn: existing.titleBn, goal: existing.goalAmount, isPublished: existing.isPublished }, after: { titleBn: campaign.titleBn, goal: campaign.goalAmount, isPublished: campaign.isPublished } },
    request.headers.get("x-real-ip"),
  );
  return NextResponse.json({ ok: true, data: { id: campaign.id } });
}

/** DELETE /api/admin/campaigns/[id] — 409 when any donation references it. */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "finance");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.campaign.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "ক্যাম্পেইন পাওয়া যায়নি।" }, { status: 404 });

  const donations = await db.donation.count({ where: { campaignId: id } });
  if (donations > 0) {
    return NextResponse.json(
      { ok: false, error: "এই ক্যাম্পেইনে অনুদানের ইতিহাস আছে — হিসাবের স্বার্থে এটি মুছা যাবে না। প্রকাশ বন্ধ করুন।" },
      { status: 409 },
    );
  }

  await db.campaign.delete({ where: { id } });
  await audit(guard.session.user.id, "campaign.delete", "Campaign", id, { before: { titleBn: existing.titleBn, slug: existing.slug } }, request.headers.get("x-real-ip"));
  return NextResponse.json({ ok: true });
}
