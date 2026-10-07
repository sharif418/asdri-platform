import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { isSameOrigin } from "@/lib/security";
import { audit } from "@/lib/audit";

const patchSchema = z.object({ action: z.literal("revoke") });

/** PATCH /api/admin/invitations/[id] — revoke a pending invitation. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!isSameOrigin(request)) return forbidden();
  const guard = await requireModule(request, "invitations");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();
  const { session } = guard;
  const { id } = await params;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "অবৈধ অনুরোধ।" }, { status: 400 });

  const invitation = await db.invitation.findUnique({ where: { id } });
  if (!invitation) return NextResponse.json({ ok: false, error: "আমন্ত্রণটি পাওয়া যায়নি।" }, { status: 404 });
  if (invitation.acceptedAt) {
    return NextResponse.json({ ok: false, error: "গৃহীত আমন্ত্রণ বাতিল করা যায় না।" }, { status: 409 });
  }
  if (invitation.revokedAt) return NextResponse.json({ ok: true });

  await db.invitation.update({ where: { id }, data: { revokedAt: new Date() } });
  await audit(
    session.user.id,
    "invitation.revoke",
    "Invitation",
    id,
    { after: { email: invitation.email } },
    request.headers.get("x-forwarded-for"),
  );
  return NextResponse.json({ ok: true });
}
