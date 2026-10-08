import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession, roleCan, unauthorized, forbidden } from "@/lib/auth";
import { parseAuditRange } from "@/lib/audit-range";

export const dynamic = "force-dynamic";

const EXPORT_LIMIT = 5000;

/** CSV escape per RFC 4180. */
function csvCell(value: string): string {
  const clean = value.replace(/\r?\n/g, " ").trim();
  if (/[",]/.test(clean)) return `"${clean.replace(/"/g, '""')}"`;
  return clean;
}

/**
 * GET /api/admin/audit/export — filtered audit log CSV (ADMIN only).
 * Round 11 (C.2): the from/to date range (shared parser with the page's
 * filter form) makes the export range-aware — an officer exports a period
 * instead of relying on the newest-first take-cap, and the CSV's filename
 * carries the range.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!roleCan(session.user.role, "audit.view")) return forbidden();

  const url = new URL(request.url);
  const entity = url.searchParams.get("entity")?.trim().slice(0, 60) ?? "";
  const action = url.searchParams.get("action")?.trim().slice(0, 60) ?? "";
  const range = parseAuditRange(
    url.searchParams.get("from") ?? undefined,
    url.searchParams.get("to") ?? undefined,
  );

  const where = {
    ...(entity ? { entity } : {}),
    ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
    ...(range ? { createdAt: { gte: range.start, lte: range.end } } : {}),
  };

  const logs = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: EXPORT_LIMIT,
    select: {
      createdAt: true,
      action: true,
      entity: true,
      entityId: true,
      ip: true,
      actor: { select: { name: true, email: true } },
      diff: true,
    },
  });

  const header = "created_at,actor,actor_email,action,entity,entity_id,ip,diff";
  const rows = logs.map((log) =>
    [
      log.createdAt.toISOString(),
      csvCell(log.actor?.name ?? "system"),
      csvCell(log.actor?.email ?? ""),
      csvCell(log.action),
      csvCell(log.entity),
      csvCell(log.entityId ?? ""),
      csvCell(log.ip ?? ""),
      csvCell(JSON.stringify(log.diff ?? {})),
    ].join(","),
  );
  const csv = [header, ...rows].join("\r\n");
  const rangeSuffix = range ? `-${range.from}_${range.to}` : "";

  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-log${rangeSuffix}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
