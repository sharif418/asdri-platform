import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { faqCreateSchema } from "@/lib/validators/admin-settings";

export const dynamic = "force-dynamic";

/** POST /api/admin/faqs — create a FAQ (admissions FAQ page content). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধ পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = faqCreateSchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join(".") || "_", i.message]));
    return NextResponse.json({ ok: false, error: "প্রশ্নোত্তরের তথ্যগুলো যাচাই করুন।", fields }, { status: 400 });
  }

  const row = await db.faq.create({ data: parsed.data });
  await audit(guard.session.user.id, "faq.create", "Faq", row.id, { after: parsed.data }, request.headers.get("x-real-ip"));
  return NextResponse.json({ ok: true, data: { id: row.id } }, { status: 201 });
}
