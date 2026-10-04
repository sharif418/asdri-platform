import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { buildUniqueFatwaSlug, slugifyTitle } from "@/lib/slug";
import { fatwaEntryCreateSchema, sanitizeFatwaPayload } from "@/lib/validators/admin-fatwa";

export const dynamic = "force-dynamic";

/** POST /api/admin/fatwa-entries — create a fatwa bank entry (ADMIN, FATWA, EDITOR). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "fatwa");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = fatwaEntryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "ফর্মের তথ্য যাচাই করুন।",
        fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])),
      },
      { status: 400 },
    );
  }

  const data = sanitizeFatwaPayload(parsed.data);

  if (data.categoryId != null) {
    const category = await db.fatwaCategory.findUnique({ where: { id: data.categoryId }, select: { id: true } });
    if (!category) {
      return NextResponse.json({ ok: false, error: "নির্বাচিত ক্যাটাগরিটি খুঁজে পাওয়া যায়নি।", fields: { categoryId: "ক্যাটাগরি নেই" } }, { status: 400 });
    }
  }

  const slug = await buildUniqueFatwaSlug(data.slug || slugifyTitle(data.questionEn) || slugifyTitle(data.questionBn) || "fatwa");

  const entry = await db.fatwaEntry.create({
    data: {
      slug,
      questionBn: data.questionBn,
      questionEn: data.questionEn,
      answerBn: data.answerBn,
      answerEn: data.answerEn,
      answeredBy: data.answeredBy,
      categoryId: data.categoryId ?? null,
      isPublished: data.isPublished,
    },
  });

  await audit(
    guard.session.user.id,
    "fatwaEntry.create",
    "FatwaEntry",
    entry.id,
    { after: { slug: entry.slug, questionBn: entry.questionBn, isPublished: entry.isPublished } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { slug: entry.slug, id: entry.id } }, { status: 201 });
}
