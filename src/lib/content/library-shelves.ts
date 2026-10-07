import { db } from "@/lib/db";
import {
  CARD_SELECT,
  toCard,
  type LibraryCardItem,
  type LibraryCategoryNode,
  type LibraryJournalGroup,
} from "@/lib/content/library";

/**
 * The catalogue's shelf queries — the non-search half of the public library
 * data layer (round 4, workstream 4b): the two-level category tree with
 * published counts, the year/language facets, the journalKey groups behind
 * the journals-by-issue shelf, same-category related items, and the read
 * counter the record page fires. Split out of library.ts to keep both files
 * inside the 500-line house style; the card/record/search half lives there.
 */
/* ————————————————————— facets ————————————————————— */

/** Two-level category tree with published-item counts (own + descendants). */
export async function getLibraryCategories(): Promise<LibraryCategoryNode[]> {
  const [rows, counts] = await Promise.all([
    db.libraryCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { nameBn: "asc" }],
      select: {
        id: true,
        slug: true,
        nameBn: true,
        nameEn: true,
        parentId: true,
      },
    }),
    db.libraryItem.groupBy({
      by: ["categoryId"],
      where: { isPublished: true, categoryId: { not: null } },
      _count: { _all: true },
    }),
  ]);
  const countById = new Map(
    counts.map((row) => [row.categoryId, row._count._all]),
  );

  interface TreeNode extends LibraryCategoryNode {
    id: string;
    parentId: string | null;
    directCount: number;
    children: TreeNode[];
  }
  const byId = new Map<string, TreeNode>(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        parentId: row.parentId,
        slug: row.slug,
        name: { bn: row.nameBn, en: row.nameEn || row.nameBn },
        count: 0,
        directCount: countById.get(row.id) ?? 0,
        children: [] as TreeNode[],
      },
    ]),
  );

  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  // published count = own items + every descendant's (bottom-up resolve)
  const resolveCount = (node: TreeNode): number => {
    node.count =
      node.directCount +
      node.children.reduce((sum, child) => sum + resolveCount(child), 0);
    return node.count;
  };
  for (const root of roots) resolveCount(root);

  const toNode = (node: TreeNode): LibraryCategoryNode => ({
    slug: node.slug,
    name: node.name,
    count: node.count,
    children: node.children.map(toNode),
  });
  return roots.map(toNode);
}

/** Distinct publication years (desc) for the year select. */
export async function getLibraryYears(): Promise<number[]> {
  const rows = await db.libraryItem.findMany({
    where: { isPublished: true, publishYear: { not: null } },
    distinct: ["publishYear"],
    orderBy: { publishYear: "desc" },
    select: { publishYear: true },
  });
  return rows
    .map((row) => row.publishYear)
    .filter((year): year is number => year != null);
}

/** Item languages present in the catalogue with their published counts. */
export async function getLibraryLanguages(): Promise<
  { code: string; count: number }[]
> {
  const rows = await db.libraryItem.groupBy({
    by: ["language"],
    where: { isPublished: true },
    _count: { _all: true },
    orderBy: { language: "asc" },
  });
  return rows.map((row) => ({ code: row.language, count: row._count._all }));
}

/* ————————————————————— journals by issue ————————————————————— */

/** journalKey groups (name, issue list, count, latest year) for the shelf. */
export async function getJournalGroups(): Promise<LibraryJournalGroup[]> {
  const rows = await db.libraryItem.findMany({
    where: {
      isPublished: true,
      type: "JOURNAL_ISSUE",
      journalKey: { not: "" },
    },
    orderBy: [
      { journalKey: "asc" },
      { publishYear: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      slug: true,
      titleBn: true,
      titleEn: true,
      volume: true,
      issueLabel: true,
      publishYear: true,
      journalKey: true,
      journalNameBn: true,
      journalNameEn: true,
    },
  });

  const groups = new Map<string, LibraryJournalGroup>();
  for (const row of rows) {
    const key = row.journalKey.trim();
    const group = groups.get(key) ?? {
      key,
      name: {
        bn: row.journalNameBn || row.titleBn,
        en:
          row.journalNameEn || row.titleEn || row.journalNameBn || row.titleBn,
      },
      issues: [],
      issueCount: 0,
      latestYear: null,
    };
    group.issues.push({
      slug: row.slug,
      title: { bn: row.titleBn, en: row.titleEn || row.titleBn },
      volume: row.volume,
      issueLabel: row.issueLabel,
      year: row.publishYear,
    });
    group.issueCount += 1;
    if (
      row.publishYear != null &&
      (group.latestYear == null || row.publishYear > group.latestYear)
    ) {
      group.latestYear = row.publishYear;
    }
    groups.set(key, group);
  }
  return [...groups.values()];
}

/* ————————————————————— related + reads ————————————————————— */

/** Same-category published items (newest first), excluding the item itself. */
export async function getRelatedLibraryItems(
  categorySlug: string,
  excludeId: string,
  take = 3,
): Promise<LibraryCardItem[]> {
  const rows = await db.libraryItem.findMany({
    where: {
      isPublished: true,
      category: { is: { slug: categorySlug } },
      id: { not: excludeId },
    },
    orderBy: [{ publishYear: "desc" }, { createdAt: "desc" }],
    take: Math.min(6, Math.max(1, take)),
    select: CARD_SELECT,
  });
  return rows.map(toCard);
}

/** One read row per open/new page — the record page's fire-and-forget counter. */
export async function recordLibraryReading(itemId: string): Promise<void> {
  try {
    await db.libraryReading.create({ data: { itemId } });
  } catch {
    // a counter must never break the page it is counting
  }
}
