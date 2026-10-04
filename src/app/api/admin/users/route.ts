import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden, hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { userCreateSchema } from "@/lib/validators/admin-media";
import { generatePassword } from "@/lib/passwords";

export const dynamic = "force-dynamic";

/** POST /api/admin/users — create a staff user (ADMIN only).
 *  The password is generated server-side and returned exactly once. */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "users");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = userCreateSchema.safeParse(body);
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
  if (await db.user.findUnique({ where: { email: data.email } })) {
    return NextResponse.json({ ok: false, error: "এই ইমেইল দিয়ে ইতিমধ্যেই একটি অ্যাকাউন্ট আছে।", fields: { email: "ডুপ্লিকেট ইমেইল" } }, { status: 409 });
  }

  const password = generatePassword();
  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash: hashPassword(password),
      isActive: true,
      createdById: guard.session.user.id,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  await audit(
    guard.session.user.id,
    "user.create",
    "User",
    user.id,
    { after: { name: user.name, email: user.email, role: user.role } },
    request.headers.get("x-real-ip"),
  );

  // The plaintext password appears exactly here — never persisted, never logged.
  return NextResponse.json({ ok: true, data: { id: user.id, password } }, { status: 201 });
}
