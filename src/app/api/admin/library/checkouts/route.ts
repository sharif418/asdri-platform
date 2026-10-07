import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, getSession, roleCan, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { libraryCheckoutCreateSchema, libraryCheckoutListQuerySchema } from "@/lib/validators/admin-library";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

/**
 * GET /api/admin/library/checkouts — circulation list with open/returned tabs.
 * Read-only: session + role guard, no CSRF.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!roleCan(session.user.role, "library.manage")) return forbidden();

  const url = new URL(request.url);
  const parsed = libraryCheckoutListQuerySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "কোয়েরি সঠিক নয়।" }, { status: 400 });
  }

  const where = {
    ...(parsed.data.status === "open" ? { returnedAt: null } : {}),
    ...(parsed.data.status === "returned" ? { returnedAt: { not: null } } : {}),
    ...(parsed.data.q
      ? {
          OR: [
            { borrowerName: { contains: parsed.data.q } },
            { borrowerPhone: { contains: parsed.data.q } },
            { item: { titleBn: { contains: parsed.data.q } } },
            { item: { titleEn: { contains: parsed.data.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    db.libraryCheckout.count({ where }),
    db.libraryCheckout.findMany({
      where,
      orderBy: [{ borrowedAt: "desc" }],
      take: PAGE_SIZE,
      include: { item: { select: { id: true, slug: true, titleBn: true, titleEn: true, type: true } } },
    }),
  ]);

  return NextResponse.json({ ok: true, data: { items, total, pageSize: PAGE_SIZE } });
}

/** POST /api/admin/library/checkouts — record that a shelf copy left the desk. */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "library");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = libraryCheckoutCreateSchema.safeParse(body);
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

  const item = await db.libraryItem.findUnique({ where: { id: parsed.data.itemId }, select: { id: true, slug: true, titleBn: true } });
  if (!item) {
    return NextResponse.json({ ok: false, error: "আইটেমটি খুঁজে পাওয়া যায়নি।", fields: { itemId: "আইটেম নয়" } }, { status: 404 });
  }

  const row = await db.libraryCheckout.create({
    data: {
      itemId: parsed.data.itemId,
      borrowerName: parsed.data.borrowerName,
      borrowerPhone: parsed.data.borrowerPhone,
      borrowerUserId: parsed.data.borrowerUserId ?? null,
      dueAt: parsed.data.dueAt ? new Date(`${parsed.data.dueAt}T23:59:59`) : null,
      note: parsed.data.note,
    },
  });

  await audit(
    guard.session.user.id,
    "library.checkout.create",
    "LibraryCheckout",
    row.id,
    { after: { item: item.slug, borrowerName: row.borrowerName, dueAt: row.dueAt } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { id: row.id } }, { status: 201 });
}
