import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { alumniProfileUpdateSchema } from "@/lib/validators/alumni";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function jsonError(error: string, fields?: Record<string, string>, status = 400): Response {
  return NextResponse.json(fields ? { ok: false, error, fields } : { ok: false, error }, { status });
}

/**
 * PATCH /api/admin/alumni/[id] — office edit of one registry row
 * (ADMIN, ADMISSIONS). The registry number is never editable: it is the
 * office handle printed on keepsakes.
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "alumni");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();
  const { id } = await params;

  const existing = await db.alumniProfile.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return jsonError("রেকর্ডটি পাওয়া যায়নি।", undefined, 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("অনুরোধের বডি পার্স করা যায়নি।");
  }

  const parsed = alumniProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      "ফর্মের তথ্য যাচাই করুন।",
      Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])),
    );
  }

  const data = parsed.data;

  const profile = await db.alumniProfile.update({ where: { id }, data });

  await audit(
    guard.session.user.id,
    "alumni.profile.update",
    "AlumniProfile",
    profile.id,
    {
      after: {
        nameBn: profile.nameBn,
        courseKey: profile.courseKey,
        batchYear: profile.batchYear,
        isPublished: profile.isPublished,
        phone: profile.phone,
        email: profile.email,
      },
    },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { id: profile.id } });
}

/**
 * DELETE /api/admin/alumni/[id] — guarded remove (ADMIN, ADMISSIONS): the row
 * must not carry an account link (unlink first), so a living alumnus's portal
 * card is never silently orphaned.
 */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "alumni");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();
  const { id } = await params;

  const existing = await db.alumniProfile.findUnique({ where: { id }, select: { id: true, userId: true, registryNo: true, nameBn: true } });
  if (!existing) return jsonError("রেকর্ডটি পাওয়া যায়নি।", undefined, 404);
  if (existing.userId) {
    return jsonError("এই প্রোফাইলের সঙ্গে একটি অ্যাকাউন্ট যুক্ত — আগে লিংক খুলে দিন।", undefined, 409);
  }

  await db.alumniProfile.delete({ where: { id } });

  await audit(
    guard.session.user.id,
    "alumni.profile.delete",
    "AlumniProfile",
    id,
    { before: { registryNo: existing.registryNo, nameBn: existing.nameBn } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true });
}
