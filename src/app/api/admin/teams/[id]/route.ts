import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { teamUpdateSchema } from "@/lib/validators/admin-content";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/teams/[id] — rename / edit a team. */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "academics");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.team.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "দলটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = teamUpdateSchema.safeParse(body);
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

  const { key, ...rest } = parsed.data;
  if (key !== undefined && key !== existing.key && (await db.team.findUnique({ where: { key } }))) {
    return NextResponse.json({ ok: false, error: "এই কী ইতিমধ্যেই ব্যবহৃত।", fields: { key: "ডুপ্লিকেট কী" } }, { status: 409 });
  }

  const team = await db.team.update({ where: { id }, data: { ...rest, ...(key !== undefined ? { key } : {}) } });
  await audit(
    guard.session.user.id,
    "team.update",
    "Team",
    team.id,
    { before: { key: existing.key, nameBn: existing.nameBn }, after: { key: team.key, nameBn: team.nameBn } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/teams/[id] — remove a team (people keep, teamId → null). */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "academics");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.team.findUnique({ where: { id }, include: { _count: { select: { people: true } } } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "দলটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }
  if (existing._count.people > 0) {
    return NextResponse.json(
      { ok: false, error: `এই দলে ${existing._count.people} জন সদস্য আছে — আগে তাদের অন্য দলে সরিয়ে নিন।` },
      { status: 409 },
    );
  }

  await db.team.delete({ where: { id } });
  await audit(guard.session.user.id, "team.delete", "Team", id, { before: { key: existing.key, nameBn: existing.nameBn } }, request.headers.get("x-real-ip"));

  return NextResponse.json({ ok: true });
}
