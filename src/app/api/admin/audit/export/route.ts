import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security";
import { parseAuditRange } from "@/lib/audit-range";

export const dynamic = "force-dynamic";

/** Max rows exported in one file (newest first) — keeps the download bounded. */
const EXPORT_ROW_LIMIT = 5000;

const CSV_HEADER = ["timestamp", "action", "actorName", "actorEmail", "entityRef", "summaryBn"] as const;

/** Escape one CSV cell — quote always, double embedded quotes. */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * GET /api/admin/audit/export — audit-log CSV download (admin-only).
 * Honors the same ?from=&to= date range as the audit page.
 * Includes a UTF-8 BOM so Excel renders the Bengali summaries correctly.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "অনুমতি নেই", code: "UNAUTHORIZED" }, { status: 403 });
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin", code: "UNAUTHORIZED" }, { status: 403 });
  }

  const limiter = rateLimit({ key: "admin-export", identifier: getClientIp(request), limit: 10, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json({ error: "Too many requests", code: "RATE_LIMIT" }, { status: 429 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const range = parseAuditRange(
      searchParams.get("from") ?? undefined,
      searchParams.get("to") ?? undefined,
    );

    const rows = await db.adminAction.findMany({
      where: range ? { createdAt: { gte: range.start, lte: range.end } } : undefined,
      orderBy: { createdAt: "desc" },
      take: EXPORT_ROW_LIMIT,
      select: { createdAt: true, action: true, actorName: true, actorEmail: true, entityRef: true, summaryBn: true },
    });

    const lines: string[] = [CSV_HEADER.map(csvCell).join(",")];
    for (const row of rows) {
      lines.push(
        [
          csvCell(row.createdAt.toISOString()),
          csvCell(row.action),
          csvCell(row.actorName),
          csvCell(row.actorEmail),
          csvCell(row.entityRef),
          csvCell(row.summaryBn),
        ].join(","),
      );
    }

    // \uFEFF BOM lets Excel detect UTF-8 and render Bengali text correctly.
    const body = `\uFEFF${lines.join("\r\n")}`;
    const dateStamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="as-sunnah-audit-log-${dateStamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে", code: "SERVER" }, { status: 500 });
  }
}
