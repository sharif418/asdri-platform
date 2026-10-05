import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { personUpdateSchema, sanitizePersonPayload } from "@/lib/validators/admin-content";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/people/[id] — update a person (ADMIN, EDITOR). */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "academics");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.person.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "ব্যক্তিটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = personUpdateSchema.safeParse(body);
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
  if (data.slug !== undefined && data.slug !== existing.slug && (await db.person.findUnique({ where: { slug: data.slug } }))) {
    return NextResponse.json({ ok: false, error: "এই স্লাগ ইতিমধ্যেই ব্যবহৃত।", fields: { slug: "স্লাগ ডুপ্লিকেট" } }, { status: 409 });
  }
  if (data.teamId && !(await db.team.findUnique({ where: { id: data.teamId } }))) {
    return NextResponse.json({ ok: false, error: "নির্বাচিত দলটি খুঁজে পাওয়া যায়নি।", fields: { teamId: "দল নেই" } }, { status: 400 });
  }
  if (data.photoMediaId && !(await db.media.findUnique({ where: { id: data.photoMediaId } }))) {
    return NextResponse.json({ ok: false, error: "নির্বাচিত ছবিটি খুঁজে পাওয়া যায়নি।", fields: { photoMediaId: "মিডিয়া নেই" } }, { status: 400 });
  }

  const { teamId, photoMediaId, ...rest } = data;
  const person = await db.person.update({
    where: { id },
    data: {
      ...rest,
      ...(teamId !== undefined ? { teamId: teamId ?? null } : {}),
      ...(photoMediaId !== undefined ? { photoMediaId: photoMediaId ?? null } : {}),
    },
  });

  await audit(
    guard.session.user.id,
    "person.update",
    "Person",
    person.id,
    { before: { nameBn: existing.nameBn, teamId: existing.teamId, isFeatured: existing.isFeatured }, after: { nameBn: person.nameBn, teamId: person.teamId, isFeatured: person.isFeatured } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { slug: person.slug } });
}

/** DELETE /api/admin/people/[id] — remove a person (ADMIN, EDITOR). */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "academics");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.person.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "ব্যক্তিটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  await db.person.delete({ where: { id } });
  await audit(guard.session.user.id, "person.delete", "Person", id, { before: { nameBn: existing.nameBn, slug: existing.slug } }, request.headers.get("x-real-ip"));

  return NextResponse.json({ ok: true });
}
