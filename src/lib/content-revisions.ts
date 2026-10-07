import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Content revision history (round 4, workstream 5).
 *
 * Where the audit log records who touched what when, a ContentRevision keeps
 * a trimmed before/after snapshot of the CONTENT fields of a Notice or Post
 * so the office can see exactly what a piece of text said before an edit.
 * Snapshots ride in the same admin request as the update itself (no
 * background job) and history is capped at the latest {@link REVISION_CAP}
 * rows per item — the trim happens in the same write.
 */

export type RevisionEntity = "Notice" | "Post";

export const REVISION_CAP = 50;

/** Longest allowed stored value per field (body HTML included). */
const FIELD_CAP = 500;

/** A flat snapshot: every value is a primitive (strings capped at FIELD_CAP). */
export type RevisionSnapshot = Record<string, string | boolean | null>;

export function isRevisionEntity(value: unknown): value is RevisionEntity {
  return value === "Notice" || value === "Post";
}

/* ————————————— snapshots ————————————— */

function cap(value: string | boolean | null): string | boolean | null {
  return typeof value === "string" && value.length > FIELD_CAP ? value.slice(0, FIELD_CAP) : value;
}

/** Cap every field of a snapshot so stored revisions stay small. */
export function snapshot(fields: RevisionSnapshot): RevisionSnapshot {
  const out: RevisionSnapshot = {};
  for (const [key, value] of Object.entries(fields)) out[key] = cap(value);
  return out;
}

/** Content fields of a Notice (category + status enums are stored as strings). */
export function noticeSnapshot(notice: {
  titleBn: string;
  titleEn: string;
  excerptBn: string;
  excerptEn: string;
  bodyBn: string;
  bodyEn: string;
  category: string;
  status: string;
  isPublished: boolean;
  publishedAt: Date;
}): RevisionSnapshot {
  return snapshot({
    titleBn: notice.titleBn,
    titleEn: notice.titleEn,
    excerptBn: notice.excerptBn,
    excerptEn: notice.excerptEn,
    bodyBn: notice.bodyBn,
    bodyEn: notice.bodyEn,
    category: notice.category,
    status: notice.status,
    isPublished: notice.isPublished,
    publishedAt: notice.publishedAt.toISOString(),
  });
}

/** Content fields of a Post (kind has no public text; category is the link id). */
export function postSnapshot(post: {
  titleBn: string;
  titleEn: string;
  excerptBn: string;
  excerptEn: string;
  bodyBn: string;
  bodyEn: string;
  categoryId: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
}): RevisionSnapshot {
  return snapshot({
    titleBn: post.titleBn,
    titleEn: post.titleEn,
    excerptBn: post.excerptBn,
    excerptEn: post.excerptEn,
    bodyBn: post.bodyBn,
    bodyEn: post.bodyEn,
    categoryId: post.categoryId,
    isPublished: post.isPublished,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
  });
}

/* ————————————— write + cap ————————————— */

/** Record one revision, then delete everything past the latest 50 (same write). */
export async function recordContentRevision(input: {
  entity: RevisionEntity;
  entityId: string;
  actorId: string | null;
  before: RevisionSnapshot;
  after: RevisionSnapshot;
}): Promise<void> {
  await db.contentRevision.create({
    data: {
      entity: input.entity,
      entityId: input.entityId,
      actorId: input.actorId,
      before: input.before as Prisma.InputJsonValue,
      after: input.after as Prisma.InputJsonValue,
    },
  });
  await trimRevisions(input.entity, input.entityId);
}

/** Keep only the newest {@link REVISION_CAP} revisions of one item. */
async function trimRevisions(entity: RevisionEntity, entityId: string): Promise<void> {
  const total = await db.contentRevision.count({ where: { entity, entityId } });
  if (total <= REVISION_CAP) return;
  const keep = await db.contentRevision.findMany({
    where: { entity, entityId },
    // id tiebreaker: rows created in the same millisecond still order stably.
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: REVISION_CAP,
    select: { id: true },
  });
  await db.contentRevision.deleteMany({
    where: { entity, entityId, id: { notIn: keep.map((row) => row.id) } },
  });
}

/* ————————————— read (admin history) ————————————— */

/** Field keys whose value differs between the two snapshots, in key order. */
export function changedFields(before: unknown, after: unknown): string[] {
  const b = (before ?? {}) as Record<string, unknown>;
  const a = (after ?? {}) as Record<string, unknown>;
  return [...new Set([...Object.keys(b), ...Object.keys(a)])].filter((key) => b[key] !== a[key]);
}

/** One serialized revision for the admin history list. */
export interface RevisionRow {
  id: string;
  createdAt: string;
  actor: { name: string; email: string } | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changed: string[];
}

/** Latest revisions of one item, newest first (default 20, capped at 50). */
export async function listContentRevisions(
  entity: RevisionEntity,
  entityId: string,
  take = 20,
): Promise<RevisionRow[]> {
  const rows = await db.contentRevision.findMany({
    where: { entity, entityId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: Math.min(Math.max(take, 1), REVISION_CAP),
    include: { actor: { select: { name: true, email: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    actor: row.actor,
    before: (row.before ?? null) as Record<string, unknown> | null,
    after: (row.after ?? null) as Record<string, unknown> | null,
    changed: changedFields(row.before, row.after),
  }));
}
