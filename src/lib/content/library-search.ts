import { Prisma, type LibraryItemType } from "@prisma/client";
import { db } from "@/lib/db";
import { queryTokens } from "@/lib/db-search";
import { CARD_SELECT, toCard, type CardRow, type LibrarySearchResult } from "@/lib/content/library";

/**
 * The catalogue's search query (round 4, workstream 4b) — the site-search
 * pattern applied to a table with no generated tsvector column: the document
 * vector is computed inline over title + subtitle + description + creator
 * names + journal name, matched with websearch_to_tsquery ('simple' for
 * Bangla, 'english' for stemming), and OR'd with a plain per-token ILIKE so
 * Bangla PREFIXES match (tsvector cannot stem আকীদা → আকীদার; ILIKE can).
 * When the raw path is unavailable the token-AND ILIKE fallback keeps the
 * catalogue searching. Facets ride both arms; MEMBERS rows ride along
 * (marked at render) — gating is page-level, never query-level.
 */
export interface LibrarySearchParams {
  q?: string;
  type?: string | null;
  /** Category slug — matches the category and its descendants. */
  category?: string | null;
  year?: number | null;
  language?: string | null;
  journalKey?: string | null;
  page?: number;
  perPage?: number;
}

interface NormalizedFilters {
  type: LibraryItemType | null;
  category: string | null;
  year: number | null;
  language: string | null;
  journalKey: string | null;
}

const LIBRARY_TYPES: LibraryItemType[] = [
  "BOOK",
  "JOURNAL_ISSUE",
  "PAPER",
  "DIGITAL_FILE",
];

function normalizeFilters(opts: LibrarySearchParams): NormalizedFilters {
  const type = LIBRARY_TYPES.find((value) => value === opts.type) ?? null;
  const year = Number.isFinite(opts.year)
    ? Math.floor(opts.year as number)
    : null;
  return {
    type,
    category: (opts.category ?? "").trim() || null,
    year: year && year > 0 ? year : null,
    language: (opts.language ?? "").trim() || null,
    journalKey: (opts.journalKey ?? "").trim() || null,
  };
}

/** Slug list for a category filter: the category itself plus its children. */
async function categorySubtreeSlugs(slug: string): Promise<string[]> {
  const rows = await db.libraryCategory.findMany({
    where: { OR: [{ slug }, { parent: { is: { slug } } }] },
    select: { slug: true },
  });
  return rows.map((row) => row.slug);
}

/** Prisma where for the non-text facets (shared by both search paths). */
async function facetWhere(
  filters: NormalizedFilters,
): Promise<Prisma.LibraryItemWhereInput> {
  const categorySlugs = filters.category
    ? await categorySubtreeSlugs(filters.category)
    : null;
  return {
    isPublished: true,
    ...(filters.type ? { type: filters.type } : {}),
    // unknown slug → empty in-list → no rows (honest empty state, not all rows)
    ...(categorySlugs
      ? { category: { is: { slug: { in: categorySlugs } } } }
      : {}),
    ...(filters.year != null ? { publishYear: filters.year } : {}),
    ...(filters.language ? { language: filters.language } : {}),
    ...(filters.journalKey ? { journalKey: filters.journalKey } : {}),
  };
}
/**
 * Ranked id search — the site-search pattern applied to a table that has no
 * generated tsvector column: the document vector is computed inline over
 * title + subtitle + description + creator names + journal name, matched
 * with websearch_to_tsquery ('simple' for Bangla, 'english' for stemming),
 * and OR'd with a plain per-token ILIKE so Bangla PREFIXES match
 * (tsvector cannot stem আকীদা → আকীদার; ILIKE can).
 */
async function searchItemIds(
  q: string,
  filters: NormalizedFilters,
  skip: number,
  take: number,
): Promise<{ ids: string[]; total: number }> {
  const tokens = queryTokens(q);
  if (tokens.length === 0) return { ids: [], total: 0 }; // punctuation-only query
  const conditions: Prisma.Sql[] = [Prisma.sql`i."isPublished" = TRUE`];
  if (filters.type)
    conditions.push(Prisma.sql`i."type"::text = ${filters.type}`);
  if (filters.category) {
    // the category itself or any of its children (two-level tree)
    conditions.push(Prisma.sql`i."categoryId" IN (
      SELECT "id" FROM "LibraryCategory" child
      WHERE child."slug" = ${filters.category}
         OR child."parentId" IN (SELECT "id" FROM "LibraryCategory" parent WHERE parent."slug" = ${filters.category})
    )`);
  }
  if (filters.year != null)
    conditions.push(Prisma.sql`i."publishYear" = ${filters.year}`);
  if (filters.language)
    conditions.push(Prisma.sql`i."language" = ${filters.language}`);
  if (filters.journalKey)
    conditions.push(Prisma.sql`i."journalKey" = ${filters.journalKey}`);

  const textMatch = Prisma.sql`(
    to_tsvector('simple', doc."searchable") @@ qs.q
    OR to_tsvector('english', doc."searchable") @@ qe.q
    OR (${Prisma.join(
      tokens.map((token) => Prisma.sql`doc."searchable" ILIKE ${`%${token}%`}`),
      " AND ",
    )})
  )`;
  const source = Prisma.sql`
    FROM "LibraryItem" i
    CROSS JOIN LATERAL (
      SELECT concat_ws(' ',
        i."titleBn", i."titleEn", i."subtitleBn", i."subtitleEn",
        i."descriptionBn", i."descriptionEn",
        i."journalNameBn", i."journalNameEn",
        (SELECT string_agg(cc."nameBn" || ' ' || cc."nameEn", ' ')
           FROM "LibraryItemCreator" ic
           JOIN "LibraryCreator" cc ON cc."id" = ic."creatorId"
          WHERE ic."itemId" = i."id")
      ) AS searchable
    ) doc
    CROSS JOIN websearch_to_tsquery('simple', ${q}) AS qs(q)
    CROSS JOIN websearch_to_tsquery('english', ${q}) AS qe(q)
    WHERE ${Prisma.join(conditions, " AND ")}
      AND ${textMatch}`;

  const [totalRows, idRows] = await Promise.all([
    db.$queryRaw<Array<{ count: number }>>(
      Prisma.sql`SELECT count(*)::int AS count ${source}`,
    ),
    db.$queryRaw<Array<{ id: string; rank: number }>>(Prisma.sql`
      SELECT i."id",
             (ts_rank(to_tsvector('simple', doc."searchable"), qs.q)
              + ts_rank(to_tsvector('english', doc."searchable"), qe.q)) AS rank
      ${source}
      ORDER BY rank DESC, i."publishYear" DESC NULLS LAST, i."createdAt" DESC
      LIMIT ${take} OFFSET ${skip}`),
  ]);
  return { ids: idRows.map((row) => row.id), total: totalRows[0]?.count ?? 0 };
}

/** Token-AND Prisma fallback (the shape searchPostEntries uses) — no raw SQL. */
function textFallbackWhere(q: string): Prisma.LibraryItemWhereInput {
  return {
    AND: queryTokens(q).map((token) => ({
      OR: [
        { titleBn: { contains: token } },
        { titleEn: { contains: token, mode: "insensitive" as const } },
        { subtitleBn: { contains: token } },
        { subtitleEn: { contains: token, mode: "insensitive" as const } },
        { descriptionBn: { contains: token } },
        { descriptionEn: { contains: token, mode: "insensitive" as const } },
        { journalNameBn: { contains: token } },
        { journalNameEn: { contains: token, mode: "insensitive" as const } },
        {
          creators: {
            some: {
              creator: {
                OR: [
                  { nameBn: { contains: token } },
                  { nameEn: { contains: token, mode: "insensitive" as const } },
                ],
              },
            },
          },
        },
      ],
    })),
  };
}

/**
 * The catalogue query: facets + optional text search, one page of hydrated
 * cards with the total count. MEMBERS rows ride along (marked at render).
 */
export async function searchLibraryItems(
  opts: LibrarySearchParams,
): Promise<LibrarySearchResult> {
  const filters = normalizeFilters(opts);
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const perPage = Math.min(48, Math.max(1, Math.floor(opts.perPage ?? 12)));
  const skip = (page - 1) * perPage;
  const q = (opts.q ?? "").trim().slice(0, 120);

  if (!q) {
    const where = await facetWhere(filters);
    const [total, rows] = await Promise.all([
      db.libraryItem.count({ where }),
      db.libraryItem.findMany({
        where,
        orderBy: [{ publishYear: "desc" }, { createdAt: "desc" }],
        skip,
        take: perPage,
        select: CARD_SELECT,
      }),
    ]);
    return {
      items: rows.map(toCard),
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
      mode: "fallback",
    };
  }

  try {
    const { ids, total } = await searchItemIds(q, filters, skip, perPage);
    const rows = await db.libraryItem.findMany({
      where: { id: { in: ids } },
      select: CARD_SELECT,
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    return {
      items: ids
        .map((id) => byId.get(id))
        .filter((row): row is CardRow => !!row)
        .map(toCard),
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
      mode: "tsvector",
    };
  } catch {
    // raw path unavailable (exotic deployment, missing function) — the
    // token-AND ILIKE fallback keeps the catalogue searching.
    const where: Prisma.LibraryItemWhereInput = {
      AND: [await facetWhere(filters), textFallbackWhere(q)],
    };
    const [total, rows] = await Promise.all([
      db.libraryItem.count({ where }),
      db.libraryItem.findMany({
        where,
        orderBy: [{ publishYear: "desc" }, { createdAt: "desc" }],
        skip,
        take: perPage,
        select: CARD_SELECT,
      }),
    ]);
    return {
      items: rows.map(toCard),
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
      mode: "fallback",
    };
  }
}
