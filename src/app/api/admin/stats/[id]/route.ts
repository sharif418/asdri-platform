import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { statUpdateSchema } from "@/lib/validators/admin-settings";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/stats/[id] — edit one figure (value, labels, order, publish). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.stat.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "পরিসংখ্যানটি পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = statUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join(".") || "_", i.message]));
    return NextResponse.json({ ok: false, error: "পরিসংখ্যানের তথ্যগুলো যাচাই করুন।", fields }, { status: 400 });
  }

  const row = await db.stat.update({ where: { id }, data: parsed.data });
  await audit(
    guard.session.user.id,
    "stat.update",
    "Stat",
    id,
    { before: existing, after: parsed.data },
    request.headers.get("x-real-ip"),
  );
  return NextResponse.json({ ok: true, data: { id: row.id } });
}

/** DELETE /api/admin/stats/[id] — remove a figure from the band. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.stat.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "পরিসংখ্যানটি পাওয়া যায়নি।" }, { status: 404 });

  await db.stat.delete({ where: { id } });
  await audit(
    guard.session.user.id,
    "stat.delete",
    "Stat",
    id,
    { before: existing },
    request.headers.get("x-real-ip"),
  );
  return NextResponse.json({ ok: true });
}
