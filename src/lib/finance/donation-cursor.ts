import type { Prisma } from "@prisma/client";

/**
 * Keyset (cursor) pagination for the donations ledger (round 11, C.2 — the
 * round-1 backlog item). Deep page-based OFFSET scans degrade past a few
 * hundred rows; the ledger now walks chronological windows instead:
 *
 *   cursor  = "<createdAt ISO>~<id>"   (the last row of the page you're on)
 *   dir=next  → rows strictly OLDER than the cursor (newest-first continues)
 *   dir=prev  → rows strictly NEWER than the cursor, re-reversed for display
 *
 * The (createdAt, id) pair is the ordering key — the id half breaks the
 * tie when two donations share a timestamp, so the walk is deterministic
 * and gap-free. Malformed cursors are ignored (the newest page renders) —
 * a stale shared URL degrades gracefully instead of erroring.
 */

export interface DonationCursor {
  createdAt: Date;
  id: string;
}

const CURSOR_RE = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)~([A-Za-z0-9_-]{5,64})$/;

/** Encode a row's position as the URL-safe cursor string. */
export function encodeDonationCursor(row: { createdAt: Date; id: string }): string {
  return `${row.createdAt.toISOString()}~${row.id}`;
}

/** Parse a cursor param — null for anything malformed (no lenient parsing). */
export function parseDonationCursor(raw: string | undefined): DonationCursor | null {
  if (!raw) return null;
  const match = CURSOR_RE.exec(raw);
  if (!match) return null;
  const createdAt = new Date(match[1]!);
  if (Number.isNaN(createdAt.getTime())) return null;
  return { createdAt, id: match[2]! };
}

/** Strictly-below predicate for the (createdAt↓, id↓) ordering. */
function below(cursor: DonationCursor): Prisma.DonationWhereInput {
  return { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] };
}

/** Strictly-above predicate for the same ordering. */
function above(cursor: DonationCursor): Prisma.DonationWhereInput {
  return { OR: [{ createdAt: { gt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { gt: cursor.id } }] };
}

/**
 * The where fragment for the active direction. `filters` keeps whatever
 * status/fund/month/search narrowing the officer already had — the cursor
 * composes with them, never replaces them.
 */
export function donationCursorWhere(filters: Prisma.DonationWhereInput, cursor: DonationCursor, dir: "next" | "prev"): Prisma.DonationWhereInput {
  return { AND: [filters, dir === "prev" ? above(cursor) : below(cursor)] };
}

/**
 * Existence probes for both directions, anchored on the displayed page's
 * first/last rows (display order is ALWAYS newest-first, whichever direction
 * produced the window). Cheap indexed findFirst calls — the pager hides the
 * button that would render an empty page.
 */
export function donationNeighborProbes(
  filters: Prisma.DonationWhereInput,
  pageEdges: { first: DonationCursor; last: DonationCursor },
): { older: Prisma.DonationWhereInput; newer: Prisma.DonationWhereInput } {
  return {
    older: { AND: [filters, below(pageEdges.last)] },
    newer: { AND: [filters, above(pageEdges.first)] },
  };
}
