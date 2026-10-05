import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { messageUpdateSchema } from "@/lib/validators/admin-media";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/messages/[id] — read/unread toggle (ADMIN, EDITOR, ADMISSIONS). */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "messages");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.contactMessage.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "বার্তাটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = messageUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "যাচাই করা যায়নি।" }, { status: 400 });
  }

  const message = await db.contactMessage.update({ where: { id }, data: { isRead: parsed.data.isRead } });

  await audit(
    guard.session.user.id,
    message.isRead ? "message.read" : "message.unread",
    "ContactMessage",
    message.id,
    { before: { isRead: existing.isRead }, after: { isRead: message.isRead } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { isRead: message.isRead } });
}

/** DELETE /api/admin/messages/[id] — remove a message. */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "messages");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.contactMessage.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "বার্তাটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  await db.contactMessage.delete({ where: { id } });
  await audit(
    guard.session.user.id,
    "message.delete",
    "ContactMessage",
    id,
    { before: { name: existing.name, subject: existing.subject } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true });
}
