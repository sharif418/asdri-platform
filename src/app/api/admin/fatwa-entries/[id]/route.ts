import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { fatwaEntryUpdateSchema, sanitizeFatwaPayload } from "@/lib/validators/admin-fatwa";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/fatwa-entries/[id] — update a fatwa bank entry (ADMIN, FATWA, EDITOR). */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "fatwa");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.fatwaEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "ফতোয়াটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = fatwaEntryUpdateSchema.safeParse(body);
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
  const { categoryId, ...rest } = data;

  if (categoryId != null) {
    const category = await db.fatwaCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!category) {
      return NextResponse.json({ ok: false, error: "নির্বাচিত ক্যাটাগরিটি খুঁজে পাওয়া যায়নি।", fields: { categoryId: "ক্যাটাগরি নেই" } }, { status: 400 });
    }
  }

  const entry = await db.fatwaEntry.update({
    where: { id },
    data: {
      ...rest,
      ...(categoryId !== undefined ? { categoryId: categoryId ?? null } : {}),
    },
  });

  await audit(
    guard.session.user.id,
    "fatwaEntry.update",
    "FatwaEntry",
    entry.id,
    {
      before: { slug: existing.slug, isPublished: existing.isPublished, answeredBy: existing.answeredBy },
      after: { slug: entry.slug, isPublished: entry.isPublished, answeredBy: entry.answeredBy },
    },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { slug: entry.slug } });
}

/** DELETE /api/admin/fatwa-entries/[id] — remove a fatwa bank entry (ADMIN, FATWA, EDITOR). */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "fatwa");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.fatwaEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "ফতোয়াটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  await db.$transaction([
    db.fatwaEntry.delete({ where: { id } }),
    // Detach any inbox questions that pointed at this bank entry.
    db.fatwaQuestion.updateMany({ where: { publishedSlug: existing.slug }, data: { publishedSlug: null } }),
  ]);

  await audit(
    guard.session.user.id,
    "fatwaEntry.delete",
    "FatwaEntry",
    id,
    { before: { slug: existing.slug, questionBn: existing.questionBn } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true });
}
