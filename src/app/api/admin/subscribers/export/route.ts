import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, roleCan, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** CSV escape per RFC 4180 (quotes doubled, wrap when needed). */
function csvCell(value: string): string {
  const clean = value.replace(/\r?\n/g, " ").trim();
  if (/[",]/.test(clean)) return `"${clean.replace(/"/g, '""')}"`;
  return clean;
}

/** GET /api/admin/subscribers/export — newsletter subscribers CSV (attachment). */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!roleCan(session.user.role, "messages.read")) return forbidden();

  const subscribers = await db.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    select: { email: true, locale: true, confirmed: true, createdAt: true },
  });

  const header = "email,locale,confirmed,subscribed_at";
  const rows = subscribers.map((row) =>
    [csvCell(row.email), csvCell(row.locale), row.confirmed ? "yes" : "no", row.createdAt.toISOString()].join(","),
  );
  const csv = [header, ...rows].join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
