import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, requireCsrf, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { alumniSelfUpdateSchema } from "@/lib/validators/alumni";

export const dynamic = "force-dynamic";

/**
 * POST /api/portal/alumni/profile — the alumnus's own contact + present-life
 * update. Scope: the row linked to this account, or — the first time — the
 * office-seeded row that carries this account's email (the claim: the row's
 * userId pins to the account, so the next visit finds it directly and no
 * other alumnus can claim the same row).
 */
export async function POST(request: NextRequest): Promise<Response> {
  const session = await requireCsrf(request);
  if (!session) return unauthorized();
  if (session.user.role !== "ALUMNI") return forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = alumniSelfUpdateSchema.safeParse(body);
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

  const userId = session.user.id;
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });

  const profile =
    (await db.alumniProfile.findUnique({ where: { userId } })) ??
    (user
      ? await db.alumniProfile.findFirst({ where: { userId: null, email: user.email }, orderBy: { createdAt: "asc" } })
      : null);

  if (!profile) {
    return NextResponse.json(
      { ok: false, error: "আপনার নামে অ্যালামনাই রেকর্ড এখনো যুক্ত হয়নি — অফিসে জানান।" },
      { status: 404 },
    );
  }

  const updated = await db.alumniProfile.update({
    where: { id: profile.id },
    // first self-update on an unclaimed row pins the account (the claim)
    data: { ...parsed.data, ...(profile.userId ? {} : { userId }) },
  });

  await audit(
    userId,
    "alumni.profile.self",
    "AlumniProfile",
    profile.id,
    { after: { registryNo: updated.registryNo, phone: updated.phone, email: updated.email } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { id: updated.id, claimed: !profile.userId } });
}
