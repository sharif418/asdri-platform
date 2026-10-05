import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { personCreateSchema, sanitizePersonPayload } from "@/lib/validators/admin-content";

export const dynamic = "force-dynamic";

/** POST /api/admin/people — create a person (ADMIN, EDITOR). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "academics");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = personCreateSchema.safeParse(body);
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

  const data = sanitizePersonPayload(parsed.data);
  const slug = data.slug || slugify(data.nameEn || data.nameBn);
  if (await db.person.findUnique({ where: { slug } })) {
    return NextResponse.json({ ok: false, error: "এই স্লাগ ইতিমধ্যেই ব্যবহৃত — অন্য একটি দিন।", fields: { slug: "স্লাগ ডুপ্লিকেট" } }, { status: 409 });
  }
  if (data.teamId && !(await db.team.findUnique({ where: { id: data.teamId } }))) {
    return NextResponse.json({ ok: false, error: "নির্বাচিত দলটি খুঁজে পাওয়া যায়নি।", fields: { teamId: "দল নেই" } }, { status: 400 });
  }
  if (data.photoMediaId && !(await db.media.findUnique({ where: { id: data.photoMediaId } }))) {
    return NextResponse.json({ ok: false, error: "নির্বাচিত ছবিটি খুঁজে পাওয়া যায়নি।", fields: { photoMediaId: "মিডিয়া নেই" } }, { status: 400 });
  }

  const { teamId, photoMediaId, ...rest } = data;
  const person = await db.person.create({
    data: {
      ...rest,
      slug,
      ...(teamId !== undefined ? { teamId: teamId ?? null } : {}),
      ...(photoMediaId !== undefined ? { photoMediaId: photoMediaId ?? null } : {}),
    },
  });

  await audit(
    guard.session.user.id,
    "person.create",
    "Person",
    person.id,
    { after: { nameBn: person.nameBn, teamId: person.teamId, isFeatured: person.isFeatured } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { slug: person.slug, id: person.id } }, { status: 201 });
}
