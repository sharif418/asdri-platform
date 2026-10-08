import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/alumni/[id]/unlink — decouple a claimed account from a
 * registry row (round 11, GAPS §E.25g). The officer no longer needs a manual
 * DB trip to satisfy DELETE's linked-row guard: one click clears userId (the
 * account itself survives and may re-claim later through the portal's email
 * claim). Guards mirror the module: alumni.manage + CSRF; an unlinked row
 * refuses with 409 (probe-safe — the button only exists on linked rows).
 */
export async function POST(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "alumni");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();
  const { id } = await params;

  const existing = await db.alumniProfile.findUnique({
    where: { id },
    select: { id: true, userId: true, registryNo: true, nameBn: true },
  });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "রেকর্ডটি পাওয়া যায়নি।" }, { status: 404 });
  }
  if (!existing.userId) {
    return NextResponse.json({ ok: false, error: "এই রেকর্ডের সঙ্গে কোনো অ্যাকাউন্ট যুক্ত নেই।" }, { status: 409 });
  }

  await db.alumniProfile.update({ where: { id }, data: { userId: null } });

  await audit(
    guard.session.user.id,
    "alumni.profile.unlink",
    "AlumniProfile",
    id,
    {
      before: { registryNo: existing.registryNo, nameBn: existing.nameBn, userId: existing.userId },
      after: { registryNo: existing.registryNo, nameBn: existing.nameBn, userId: null },
    },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { id, userId: null } });
}
