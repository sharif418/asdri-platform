import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Ranked full-text search over the live corpus (FatwaEntry + Notice) using
 * PostgreSQL tsvector columns (see migration *_search_tsvectors): Bengali via
 * the 'simple' analyser, English with stemming, question/title hits weighted
 * above answer/body hits. Multi-word queries match entries containing ALL
 * tokens anywhere (AND semantics) — not contiguous substrings — and results
 * are ordered by ts_rank.
 *
 * Databases without the generated column (e.g. boot-time migration races)
 * transparently fall back to token-AND ILIKE via Prisma, which keeps English
 * searches case-insensitive (the historical /search page bug).
 */

export type SearchMode = "tsvector" | "fallback";

export interface IdRankResult {
  /** Ordered ids (best match first). */
  ids: string[];
  rankById: Map<string, number>;
  total: number;
  mode: SearchMode;
}

const columnCache = new Map<string, boolean>();

/** True when the table carries the generated `searchTsv` column (memoised). */
async function hasSearchColumn(table: "Notice" | "FatwaEntry"): Promise<boolean> {
  const cached = columnCache.get(table);
  if (cached !== undefined) return cached;
  try {
    const rows = await db.$queryRaw<Array<{ ok: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = ${table} AND column_name = 'searchTsv'
      ) AS ok`;
    const ok = rows.length > 0 && rows[0].ok === true;
    columnCache.set(table, ok);
    return ok;
  } catch {
    return false;
  }
}

/** Whitespace tokens of a query — drives both the fallback AND the UI hints. */
export function queryTokens(q: string): string[] {
  return q
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .slice(0, 8);
}

function pagedResult(ids: string[], total: number, mode: SearchMode): IdRankResult {
  const rankById = new Map<string, number>();
  return { ids, rankById, total, mode };
}

/* ————————————————————— Fatwa bank ————————————————————— */

/** Token-AND, case-insensitive Prisma fallback for the fatwa bank. */
export function buildFatwaFallbackWhere(q: string, categoryKey?: string | null): Prisma.FatwaEntryWhereInput {
  return {
    isPublished: true,
    ...(categoryKey ? { category: { key: categoryKey } } : {}),
    AND: queryTokens(q).map((token) => ({
      OR: [
        { questionBn: { contains: token, mode: "insensitive" as const } },
        { questionEn: { contains: token, mode: "insensitive" as const } },
        { answerBn: { contains: token, mode: "insensitive" as const } },
        { answerEn: { contains: token, mode: "insensitive" as const } },
      ],
    })),
  };
}

/**
 * Search published fatwas. Returns ranked ids + the total match count; the
 * caller hydrates them with its own Prisma select (keeps DTO mapping in one
 * place) and re-orders by `ids`.
 */
export async function searchFatwaEntries(opts: {
  q: string;
  categoryKey?: string | null;
  skip: number;
  take: number;
}): Promise<IdRankResult> {
  const q = opts.q.trim();
  const tokens = queryTokens(q);
  if (tokens.length === 0 || opts.take <= 0) {
    return pagedResult([], 0, "fallback");
  }

  if (!(await hasSearchColumn("FatwaEntry"))) {
    const where = buildFatwaFallbackWhere(q, opts.categoryKey);
    const [total, rows] = await Promise.all([
      db.fatwaEntry.count({ where }),
      db.fatwaEntry.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: opts.skip,
        take: opts.take,
        select: { id: true },
      }),
    ]);
    return pagedResult(rows.map((row) => row.id), total, "fallback");
  }

  const categoryKey = opts.categoryKey ?? null;
  const filter = Prisma.sql`
    FROM "FatwaEntry" f
    CROSS JOIN websearch_to_tsquery('simple', ${q}) AS qs(q)
    CROSS JOIN websearch_to_tsquery('english', ${q}) AS qe(q)
    WHERE f."isPublished" = true
      AND (${categoryKey}::text IS NULL OR f."categoryId" IN (
        SELECT "id" FROM "FatwaCategory" WHERE "key" = ${categoryKey}
      ))
      AND (f."searchTsv" @@ qs.q OR f."searchTsv" @@ qe.q)`;

  const [totalRows, idRows] = await Promise.all([
    db.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT count(*)::int AS count ${filter}`),
    db.$queryRaw<Array<{ id: string; rank: number }>>(Prisma.sql`
      SELECT f."id", (ts_rank(f."searchTsv", qs.q) + ts_rank(f."searchTsv", qe.q)) AS rank
      ${filter}
      ORDER BY rank DESC, f."publishedAt" DESC
      LIMIT ${opts.take} OFFSET ${opts.skip}`),
  ]);

  const result = pagedResult(
    idRows.map((row) => row.id),
    totalRows[0]?.count ?? 0,
    "tsvector",
  );
  for (const row of idRows) result.rankById.set(row.id, row.rank);
  return result;
}

/* ————————————————————— Notice board ————————————————————— */

/** Token-AND, case-insensitive Prisma fallback for the notice board. */
export function buildNoticeFallbackWhere(q: string): Prisma.NoticeWhereInput {
  return {
    isPublished: true,
    AND: queryTokens(q).map((token) => ({
      OR: [
        { titleBn: { contains: token, mode: "insensitive" as const } },
        { titleEn: { contains: token, mode: "insensitive" as const } },
        { excerptBn: { contains: token, mode: "insensitive" as const } },
        { excerptEn: { contains: token, mode: "insensitive" as const } },
        { bodyBn: { contains: token, mode: "insensitive" as const } },
        { bodyEn: { contains: token, mode: "insensitive" as const } },
      ],
    })),
  };
}

/** Search published notices (title/excerpt weighted above body). */
export async function searchNoticeEntries(opts: { q: string; skip: number; take: number }): Promise<IdRankResult> {
  const q = opts.q.trim();
  const tokens = queryTokens(q);
  if (tokens.length === 0 || opts.take <= 0) {
    return pagedResult([], 0, "fallback");
  }

  if (!(await hasSearchColumn("Notice"))) {
    const where = buildNoticeFallbackWhere(q);
    const [total, rows] = await Promise.all([
      db.notice.count({ where }),
      db.notice.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: opts.skip,
        take: opts.take,
        select: { id: true },
      }),
    ]);
    return pagedResult(rows.map((row) => row.id), total, "fallback");
  }

  const filter = Prisma.sql`
    FROM "Notice" n
    CROSS JOIN websearch_to_tsquery('simple', ${q}) AS qs(q)
    CROSS JOIN websearch_to_tsquery('english', ${q}) AS qe(q)
    WHERE n."isPublished" = true
      AND (n."searchTsv" @@ qs.q OR n."searchTsv" @@ qe.q)`;

  const [totalRows, idRows] = await Promise.all([
    db.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT count(*)::int AS count ${filter}`),
    db.$queryRaw<Array<{ id: string; rank: number }>>(Prisma.sql`
      SELECT n."id", (ts_rank(n."searchTsv", qs.q) + ts_rank(n."searchTsv", qe.q)) AS rank
      ${filter}
      ORDER BY rank DESC, n."publishedAt" DESC
      LIMIT ${opts.take} OFFSET ${opts.skip}`),
  ]);

  const result = pagedResult(
    idRows.map((row) => row.id),
    totalRows[0]?.count ?? 0,
    "tsvector",
  );
  for (const row of idRows) result.rankById.set(row.id, row.rank);
  return result;
}

/** Re-order hydrated Prisma rows to the id order returned by a search. */
export function orderByIds<T extends { id: string }>(rows: T[], ids: string[]): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const ordered: T[] = [];
  for (const id of ids) {
    const row = byId.get(id);
    if (row) ordered.push(row);
  }
  return ordered;
}
