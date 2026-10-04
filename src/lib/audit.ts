import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Audit trail — every admin mutation records who, what, entity, and a trimmed
 * diff of changed fields. Written by the shared repository helpers so no
 * route can forget it.
 */

export async function audit(
  actorId: string | null | undefined,
  action: string,
  entity: string,
  entityId?: string | null,
  diff?: { before?: unknown; after?: unknown },
  ip?: string | null,
): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      entity,
      entityId: entityId ?? null,
      diff: (diff ? trimDiff(diff) : undefined) as Prisma.InputJsonValue | undefined,
      ip: ip ?? null,
    },
  });
}

function trimDiff(diff: { before?: unknown; after?: unknown }): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (diff.before !== undefined) out.before = shallow(diff.before);
  if (diff.after !== undefined) out.after = shallow(diff.after);
  return out;
}

/** Keep diffs small: strings truncated, nested objects dropped. */
function shallow(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.slice(0, 300);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === "object") {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(src).slice(0, 40)) {
      out[k] = typeof v === "string" ? v.slice(0, 120) : typeof v === "object" ? "…" : v;
    }
    return out;
  }
  return String(value);
}
