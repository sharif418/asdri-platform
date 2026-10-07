import { NextRequest, NextResponse } from "next/server";
import { getSession, roleCan, unauthorized, forbidden } from "@/lib/auth";
import { isRevisionEntity, listContentRevisions } from "@/lib/content-revisions";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/revisions?entity=Notice&entityId=… — the revision history of
 * one Notice/Post for the admin history panel (latest 20, actor names
 * included). Read-only: session + content.manage guard, no CSRF.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!roleCan(session.user.role, "content.manage")) return forbidden();

  const url = new URL(request.url);
  const entity = url.searchParams.get("entity");
  const entityId = url.searchParams.get("entityId") ?? "";
  if (!isRevisionEntity(entity) || !entityId) {
    return NextResponse.json({ ok: false, error: "কোয়েরি সঠিক নয়।" }, { status: 400 });
  }

  const revisions = await listContentRevisions(entity, entityId, 20);
  return NextResponse.json({ ok: true, data: { revisions } });
}
