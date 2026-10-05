import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { faqUpdateSchema } from "@/lib/validators/admin-settings";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/faqs/[id] — edit a FAQ. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.faq.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "প্রশ্নোত্তরটি পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = faqUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join(".") || "_", i.message]));
    return NextResponse.json({ ok: false, error: "প্রশ্নোত্তরের তথ্যগুলো যাচাই করুন।", fields }, { status: 400 });
  }

  const row = await db.faq.update({ where: { id }, data: parsed.data });
  await audit(
    guard.session.user.id,
    "faq.update",
    "Faq",
    id,
    { before: existing, after: parsed.data },
    request.headers.get("x-real-ip"),
  );
  return NextResponse.json({ ok: true, data: { id: row.id } });
}

/** DELETE /api/admin/faqs/[id] — remove a FAQ. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.faq.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "প্রশ্নোত্তরটি পাওয়া যায়নি।" }, { status: 404 });

  await db.faq.delete({ where: { id } });
  await audit(guard.session.user.id, "faq.delete", "Faq", id, { before: existing }, request.headers.get("x-real-ip"));
  return NextResponse.json({ ok: true });
}
