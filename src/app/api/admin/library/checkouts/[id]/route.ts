import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { libraryCheckoutUpdateSchema } from "@/lib/validators/admin-library";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/library/checkouts/[id] — mark a checkout returned
 * (`{ returned: true }` stamps now; `returned: false` undoes a mistake).
 * An explicit ISO `returnedAt` wins when the office needs to backdate.
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "library");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.libraryCheckout.findUnique({ where: { id }, include: { item: { select: { slug: true } } } });
  if (!existing) return NextResponse.json({ ok: false, error: "ধারের রেকর্ডটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = libraryCheckoutUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join(".") || "_", i.message]));
    return NextResponse.json({ ok: false, error: "তথ্য যাচাই করুন।", fields }, { status: 400 });
  }

  let returnedAt: Date | null;
  if (parsed.data.returnedAt !== undefined) {
    returnedAt = parsed.data.returnedAt ? new Date(parsed.data.returnedAt) : null;
  } else if (parsed.data.returned !== undefined) {
    returnedAt = parsed.data.returned ? new Date() : null;
  } else {
    returnedAt = existing.returnedAt;
  }

  const row = await db.libraryCheckout.update({ where: { id }, data: { returnedAt } });

  await audit(
    guard.session.user.id,
    "library.checkout.return",
    "LibraryCheckout",
    id,
    {
      before: { item: existing.item.slug, borrowerName: existing.borrowerName, returnedAt: existing.returnedAt },
      after: { returnedAt: row.returnedAt },
    },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { id: row.id, returnedAt: row.returnedAt } });
}
