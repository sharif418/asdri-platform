import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

/** Shared shape for create/edit (PATCH merges only the provided fields). */
const campaignBase = {
  titleBn: z.string().trim().min(2, "শিরোনাম (বাংলা) দিন").max(160),
  titleEn: z.string().trim().max(160).default(""),
  descriptionBn: z.string().trim().max(2000).default(""),
  descriptionEn: z.string().trim().max(2000).default(""),
  goalAmount: z.number({ message: "লক্ষ্য পরিমাণ দিন" }).int("পূর্ণ সংখ্যা দিন").min(1000, "সর্বনিম্ন ১০০০ টাকা").max(100000000, "পরিমাণটি অতিরিক্ত বড়"),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
};

const campaignCreateSchema = z.object({ ...campaignBase, fundId: z.string().min(1, "ফান্ড নির্বাচন করুন") });
const campaignPatchSchema = z
  .object({ ...campaignBase, fundId: z.string().min(1).optional() })
  .partial();

function zodFields(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(error.issues.map((i) => [i.path.join("."), i.message]));
}

/** POST /api/admin/campaigns — create a fundraising campaign (ADMIN, FINANCE). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "finance");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = campaignCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "যাচাই করুন।", fields: zodFields(parsed.error) }, { status: 400 });
  }

  const d = parsed.data;
  const fund = await db.fund.findUnique({ where: { id: d.fundId } });
  if (!fund) return NextResponse.json({ ok: false, error: "ফান্ড পাওয়া যায়নি।" }, { status: 404 });

  let slug = slugify(d.titleEn || d.titleBn);
  const clash = await db.campaign.findUnique({ where: { slug } });
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;

  const campaign = await db.campaign.create({
    data: {
      slug,
      fundId: d.fundId,
      titleBn: d.titleBn,
      titleEn: d.titleEn,
      descriptionBn: d.descriptionBn,
      descriptionEn: d.descriptionEn,
      goalAmount: d.goalAmount,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      isPublished: d.isPublished,
      sortOrder: d.sortOrder,
    },
  });
  await audit(guard.session.user.id, "campaign.create", "Campaign", campaign.id, { after: { titleBn: campaign.titleBn, goal: campaign.goalAmount, fund: fund.key } }, request.headers.get("x-real-ip"));
  return NextResponse.json({ ok: true, data: { id: campaign.id } }, { status: 201 });
}
