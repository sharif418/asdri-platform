import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { userUpdateSchema } from "@/lib/validators/admin-media";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/users/[id] — role / active / name (ADMIN only). */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "users");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "ইউজারটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = userUpdateSchema.safeParse(body);
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
  const isSelf = existing.id === guard.session.user.id;
  if (isSelf && data.isActive === false) {
    return NextResponse.json({ ok: false, error: "নিজের অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না।" }, { status: 400 });
  }
  if (isSelf && data.role !== undefined && data.role !== existing.role) {
    return NextResponse.json({ ok: false, error: "নিজের রোল বদলানো যাবে না — অন্য একজন অ্যাডমিন করবেন।" }, { status: 400 });
  }

  const user = await db.user.update({ where: { id }, data });

  // deactivation revokes every live session for that user
  if (data.isActive === false) {
    await db.session.deleteMany({ where: { userId: id } }).catch(() => undefined);
  }

  await audit(
    guard.session.user.id,
    "user.update",
    "User",
    user.id,
    { before: { role: existing.role, isActive: existing.isActive }, after: { role: user.role, isActive: user.isActive } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { id: user.id, role: user.role, isActive: user.isActive } });
}

/** DELETE /api/admin/users/[id] — remove a user (ADMIN only, never self). */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "users");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "ইউজারটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }
  if (existing.id === guard.session.user.id) {
    return NextResponse.json({ ok: false, error: "নিজের অ্যাকাউন্ট মুছে ফেলা যাবে না।" }, { status: 400 });
  }

  await db.user.delete({ where: { id } }); // sessions cascade
  await audit(
    guard.session.user.id,
    "user.delete",
    "User",
    id,
    { before: { name: existing.name, email: existing.email, role: existing.role } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true });
}
