import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden, hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { generatePassword } from "@/lib/passwords";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** POST /api/admin/users/[id]/reset-password — new random password (ADMIN only).
 *  All of the user's sessions are revoked; the password returns exactly once. */
export async function POST(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "users");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "ইউজারটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  const password = generatePassword();
  await db.user.update({ where: { id }, data: { passwordHash: hashPassword(password) } });
  await db.session.deleteMany({ where: { userId: id } });

  await audit(
    guard.session.user.id,
    "user.reset-password",
    "User",
    id,
    { after: { email: existing.email } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { password } });
}
