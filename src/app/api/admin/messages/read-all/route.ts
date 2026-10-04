import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** POST /api/admin/messages/read-all — mark every unread message read. */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "messages");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const result = await db.contactMessage.updateMany({ where: { isRead: false }, data: { isRead: true } });

  await audit(
    guard.session.user.id,
    "message.read-all",
    "ContactMessage",
    null,
    { after: { markedRead: result.count } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { markedRead: result.count } });
}
