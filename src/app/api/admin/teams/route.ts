import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { teamCreateSchema, teamReorderSchema } from "@/lib/validators/admin-content";

export const dynamic = "force-dynamic";

/** POST /api/admin/teams — create a team (ADMIN, EDITOR). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "academics");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = teamCreateSchema.safeParse(body);
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
  if (await db.team.findUnique({ where: { key: data.key } })) {
    return NextResponse.json({ ok: false, error: "এই কী ইতিমধ্যেই ব্যবহৃত — অন্যটি দিন।", fields: { key: "ডুপ্লিকেট কী" } }, { status: 409 });
  }

  const team = await db.team.create({ data });
  await audit(guard.session.user.id, "team.create", "Team", team.id, { after: { key: team.key, nameBn: team.nameBn } }, request.headers.get("x-real-ip"));

  return NextResponse.json({ ok: true, data: { id: team.id } }, { status: 201 });
}

/** PATCH /api/admin/teams — reorder the whole team list in one payload. */
export async function PATCH(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "academics");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = teamReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "ক্রম যাচাই করা যায়নি।" }, { status: 400 });
  }

  const existingIds = new Set((await db.team.findMany({ select: { id: true } })).map((t) => t.id));
  const valid = parsed.data.order.filter((item) => existingIds.has(item.id));
  if (valid.length === 0) {
    return NextResponse.json({ ok: false, error: "কোনো বৈধ দল পাওয়া যায়নি।" }, { status: 400 });
  }

  await db.$transaction(valid.map((item) => db.team.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })));
  await audit(guard.session.user.id, "team.reorder", "Team", null, { after: { order: valid.map((v) => v.id) } }, request.headers.get("x-real-ip"));

  return NextResponse.json({ ok: true });
}
