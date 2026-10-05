import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { postCategoryCreateSchema } from "@/lib/validators/admin-content";

export const dynamic = "force-dynamic";

/** POST /api/admin/post-categories — inline category create (ADMIN, EDITOR). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = postCategoryCreateSchema.safeParse(body);
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

  const data = parsed.data;
  const slug = data.slug || slugify(data.nameEn || data.nameBn);
  if (await db.postCategory.findUnique({ where: { slug } })) {
    return NextResponse.json({ ok: false, error: "এই ক্যাটাগরি (স্লাগ) ইতিমধ্যেই আছে।", fields: { slug: "ডুপ্লিকেট" } }, { status: 409 });
  }

  const last = await db.postCategory.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const category = await db.postCategory.create({
    data: {
      slug,
      nameBn: data.nameBn,
      nameEn: data.nameEn,
      sortOrder: data.sortOrder ?? (last ? last.sortOrder + 1 : 0),
    },
  });

  await audit(
    guard.session.user.id,
    "postCategory.create",
    "PostCategory",
    category.id,
    { after: { nameBn: category.nameBn, slug: category.slug } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { id: category.id, nameBn: category.nameBn } }, { status: 201 });
}
