import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getLibraryItemBySlug } from "@/lib/content/library";
import { searchLibraryItems } from "@/lib/content/library-search";
import {
  getJournalGroups,
  getLibraryCategories,
} from "@/lib/content/library-shelves";

/**
 * Round 4, workstream 4b — the PUBLIC library's proofs:
 *
 *   1. bilingual search: a Bangla TITLE PREFIX finds its item (the ILIKE
 *      arm of the tsvector+fallback pattern) and an English word finds its
 *      item (the websearch_to_tsquery arm)
 *   2. search also reaches creator names
 *   3. the category facet narrows, and a parent category sweeps in its child
 *   4. a MEMBERS item stays listed in the catalogue and getLibraryItemBySlug
 *      still returns it — gating is page-level, never query-level
 *   5. unpublished rows are invisible everywhere public
 *   6. journal grouping counts issues per journalKey with the latest year
 *   7. the readings counter API increments, validates, and rate-limits
 *
 * Self-contained fixtures (the test DB is migrated but NOT seeded): rows
 * are created straight through Prisma and removed again in afterAll.
 */

process.env.SESSION_SECRET ??=
  "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

// Route handler imported AFTER the env is in place.
const { POST: RECORD_READING } =
  await import("@/app/api/library/readings/route");

const RUN = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

function jsonRequest(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

let categoryId: string;
let childCategoryId: string;
let aqidahBookId: string;
let englishBookId: string;
let membersItemId: string;
let draftItemId: string;
let journalIssueNewId: string;
let journalIssueOldId: string;
let childBookId: string;

beforeAll(async () => {
  const parent = await db.libraryCategory.create({
    data: {
      slug: `pub-test-aqidah-${RUN}`,
      nameBn: "পাবলিক পরীক্ষা আকীদা",
      nameEn: "Public Test Aqidah",
      sortOrder: 90,
    },
  });
  categoryId = parent.id;
  const child = await db.libraryCategory.create({
    data: {
      slug: `pub-test-aqidah-child-${RUN}`,
      nameBn: "পাবলিক পরীক্ষা উপ-আকীদা",
      nameEn: "Public Test Aqidah Child",
      parentId: parent.id,
      sortOrder: 91,
    },
  });
  childCategoryId = child.id;

  const [aqidahBook, englishBook, membersItem, draftItem, childBook] =
    await Promise.all([
      db.libraryItem.create({
        data: {
          slug: `pub-test-aqidah-book-${RUN}`,
          type: "BOOK",
          titleBn: "আকীদার ভিত্তি: পাবলিক পরীক্ষা গ্রন্থ",
          titleEn: "Foundations of Aqidah Public Test Book",
          descriptionBn: "<p>তাওহীদ ও আকীদার প্রাথমিক আলোচনা।</p>",
          language: "bn",
          categoryId: parent.id,
          publishYear: 2024,
          isPublished: true,
        },
      }),
      db.libraryItem.create({
        data: {
          slug: `pub-test-zirconium-book-${RUN}`,
          type: "PAPER",
          titleBn: "জিরকোনিয়াম নিয়ে গবেষণা",
          titleEn: "Zirconium Reflections in Islamic Scholarship",
          descriptionBn: "",
          language: "en",
          categoryId: parent.id,
          publishYear: 2025,
          isPublished: true,
        },
      }),
      db.libraryItem.create({
        data: {
          slug: `pub-test-members-book-${RUN}`,
          type: "BOOK",
          titleBn: "সদস্যদের জন্য সংরক্ষিত গ্রন্থ",
          titleEn: "Members Only Test Book",
          descriptionBn: "",
          language: "bn",
          categoryId: parent.id,
          publishYear: 2025,
          visibility: "MEMBERS",
          isPublished: true,
        },
      }),
      db.libraryItem.create({
        data: {
          slug: `pub-test-draft-book-${RUN}`,
          type: "BOOK",
          titleBn: "খসড়া গ্রন্থ আকীদা",
          titleEn: "Draft Aqidah Book",
          descriptionBn: "",
          language: "bn",
          categoryId: parent.id,
          isPublished: false,
        },
      }),
      db.libraryItem.create({
        data: {
          slug: `pub-test-child-book-${RUN}`,
          type: "BOOK",
          titleBn: "উপ-ক্যাটাগরির বই",
          titleEn: "Child Category Book",
          descriptionBn: "",
          language: "bn",
          categoryId: child.id,
          publishYear: 2023,
          isPublished: true,
        },
      }),
    ]);
  aqidahBookId = aqidahBook.id;
  englishBookId = englishBook.id;
  membersItemId = membersItem.id;
  draftItemId = draftItem.id;
  childBookId = childBook.id;

  // two issues of one journal → one group
  const journalBase = {
    type: "JOURNAL_ISSUE" as const,
    journalKey: `pub-test-journal-${RUN}`,
    journalNameBn: "পাবলিক পরীক্ষা জার্নাল",
    journalNameEn: "Public Test Journal",
    language: "bn",
    categoryId: parent.id,
    isPublished: true,
  };
  const [issueNew, issueOld] = await Promise.all([
    db.libraryItem.create({
      data: {
        ...journalBase,
        slug: `pub-test-journal-v2-${RUN}`,
        titleBn: "পাবলিক পরীক্ষা জার্নাল দ্বিতীয় সংখ্যা",
        volume: "২",
        issueLabel: "২য় সংখ্যা",
        publishYear: 2025,
      },
    }),
    db.libraryItem.create({
      data: {
        ...journalBase,
        slug: `pub-test-journal-v1-${RUN}`,
        titleBn: "পাবলিক পরীক্ষা জার্নাল প্রথম সংখ্যা",
        volume: "১",
        issueLabel: "১ম সংখ্যা",
        publishYear: 2024,
      },
    }),
  ]);
  journalIssueNewId = issueNew.id;
  journalIssueOldId = issueOld.id;

  // a creator on the aqidah book — search must reach creator names too
  const creator = await db.libraryCreator.create({
    data: { nameBn: "লেখক আরিফুর রহমান", nameEn: "Author Arifur Rahman" },
  });
  await db.libraryItemCreator.create({
    data: {
      itemId: aqidahBook.id,
      creatorId: creator.id,
      role: "AUTHOR",
      sortOrder: 0,
    },
  });
});

afterAll(async () => {
  await db.libraryItem.deleteMany({
    where: {
      id: {
        in: [
          aqidahBookId,
          englishBookId,
          membersItemId,
          draftItemId,
          childBookId,
          journalIssueNewId,
          journalIssueOldId,
        ],
      },
    },
  });
  await db.libraryCategory.deleteMany({
    where: { id: { in: [categoryId, childCategoryId] } },
  });
  await db.libraryCreator.deleteMany({
    where: { nameEn: "Author Arifur Rahman" },
  });
});

describe("public library search + facets", () => {
  test("a Bangla title PREFIX finds its item (ILIKE arm of the pattern)", async () => {
    const result = await searchLibraryItems({ q: "আকীদার ভিত্তি" });
    expect(result.items.some((item) => item.id === aqidahBookId)).toBe(true);
  });

  test("an English word finds its item (websearch_to_tsquery arm)", async () => {
    const result = await searchLibraryItems({ q: "zirconium" });
    expect(result.items.some((item) => item.id === englishBookId)).toBe(true);
  });

  test("search reaches creator names", async () => {
    const result = await searchLibraryItems({ q: "Arifur" });
    expect(result.items.some((item) => item.id === aqidahBookId)).toBe(true);
  });

  test("the category facet narrows and a parent sweeps in its child", async () => {
    const parentSlug = `pub-test-aqidah-${RUN}`;
    const childSlug = `pub-test-aqidah-child-${RUN}`;
    const byParent = await searchLibraryItems({
      category: parentSlug,
      perPage: 48,
    });
    expect(byParent.items.some((item) => item.id === aqidahBookId)).toBe(true);
    expect(byParent.items.some((item) => item.id === childBookId)).toBe(true); // descendant included
    const byChild = await searchLibraryItems({
      category: childSlug,
      perPage: 48,
    });
    expect(byChild.items.some((item) => item.id === childBookId)).toBe(true);
    expect(byChild.items.some((item) => item.id === aqidahBookId)).toBe(false); // no upward bleed
    // the draft and members rows obey the same facet
    expect(byParent.items.some((item) => item.id === draftItemId)).toBe(false);
    expect(byParent.items.some((item) => item.id === membersItemId)).toBe(true);
  });

  test("MEMBERS rows are listed (marked) but the slug lookup stays page-level", async () => {
    const listed = await searchLibraryItems({ perPage: 48 });
    const membersRow = listed.items.find((item) => item.id === membersItemId);
    expect(membersRow).toBeDefined();
    expect(membersRow!.visibility).toBe("MEMBERS");
    // the gate lives on the page, not in the query
    const detail = await getLibraryItemBySlug(`pub-test-members-book-${RUN}`);
    expect(detail).not.toBeNull();
    expect(detail!.visibility).toBe("MEMBERS");
  });

  test("unpublished rows are invisible to search and slug lookup", async () => {
    const listed = await searchLibraryItems({ q: "খসড়া", perPage: 48 });
    expect(listed.items.some((item) => item.id === draftItemId)).toBe(false);
    const byTitle = await searchLibraryItems({
      q: "Draft Aqidah Book",
      perPage: 48,
    });
    expect(byTitle.items.some((item) => item.id === draftItemId)).toBe(false);
    expect(await getLibraryItemBySlug(`pub-test-draft-book-${RUN}`)).toBeNull();
  });

  test("pagination counts come back with the page", async () => {
    const page1 = await searchLibraryItems({ page: 1, perPage: 2 });
    expect(page1.items.length).toBe(2);
    expect(page1.total).toBeGreaterThan(2);
    expect(page1.totalPages).toBeGreaterThanOrEqual(2);
    const page2 = await searchLibraryItems({ page: 2, perPage: 2 });
    expect(page2.items.length).toBeGreaterThan(0);
    expect(page2.items[0]!.id).not.toBe(page1.items[0]!.id);
  });
});

describe("journals by issue", () => {
  test("one journalKey group counts both issues with the latest year", async () => {
    const groups = await getJournalGroups();
    const group = groups.find(
      (entry) => entry.key === `pub-test-journal-${RUN}`,
    );
    expect(group).toBeDefined();
    expect(group!.issueCount).toBe(2);
    expect(group!.latestYear).toBe(2025);
    expect(group!.issues.map((issue) => issue.volume).sort()).toEqual([
      "১",
      "২",
    ]);
    // newest first
    expect(group!.issues[0]!.year).toBe(2025);
  });
});

describe("category tree", () => {
  test("published counts only, descendants rolled into the parent", async () => {
    const tree = await getLibraryCategories();
    const parent = tree.find((node) => node.slug === `pub-test-aqidah-${RUN}`);
    expect(parent).toBeDefined();
    // parent's own published items (book + paper + members + 2 issues) + child's 1
    expect(parent!.children.length).toBe(1);
    expect(parent!.count).toBeGreaterThanOrEqual(6);
    expect(parent!.children[0]!.count).toBe(1);
  });
});

describe("readings counter API", () => {
  test("posts increment the counter; validation and lookups are honest", async () => {
    const before = await db.libraryReading.count({
      where: { itemId: aqidahBookId },
    });

    const first = await RECORD_READING(
      jsonRequest("http://local/api/library/readings", {
        itemId: aqidahBookId,
        page: 3,
      }),
    );
    expect(first.status).toBe(201);
    const second = await RECORD_READING(
      jsonRequest("http://local/api/library/readings", {
        itemId: aqidahBookId,
      }),
    );
    expect(second.status).toBe(201);

    const after = await db.libraryReading.count({
      where: { itemId: aqidahBookId },
    });
    expect(after).toBe(before + 2);

    // unknown item → 404; malformed body → 400
    const unknown = await RECORD_READING(
      jsonRequest("http://local/api/library/readings", {
        itemId: "no-such-item-id",
        page: 1,
      }),
    );
    expect(unknown.status).toBe(404);
    const malformed = await RECORD_READING(
      new NextRequest("http://local/api/library/readings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not-json",
      }),
    );
    expect(malformed.status).toBe(400);

    // drafts are not countable either
    const draftRead = await RECORD_READING(
      jsonRequest("http://local/api/library/readings", { itemId: draftItemId }),
    );
    expect(draftRead.status).toBe(404);

    // cross-origin posts are refused outright
    const crossOrigin = await RECORD_READING(
      jsonRequest(
        "http://local/api/library/readings",
        { itemId: aqidahBookId },
        { origin: "https://evil.example" },
      ),
    );
    expect(crossOrigin.status).toBe(403);
  });

  test("rate limit: a burst from one IP sees 201s then 429s (shape only, no timing pinned)", async () => {
    // a dedicated IP keeps this bucket isolated from the test above
    const headers = { "x-forwarded-for": "203.0.113.77" };
    const statuses: number[] = [];
    for (let i = 0; i < 40; i++) {
      const res = await RECORD_READING(
        jsonRequest(
          "http://local/api/library/readings",
          { itemId: aqidahBookId, page: i + 1 },
          headers,
        ),
      );
      statuses.push(res.status);
    }
    const allowed = statuses.filter((status) => status === 201).length;
    const throttled = statuses.filter((status) => status === 429).length;
    expect(allowed).toBeGreaterThan(0); // the first posts go through
    expect(throttled).toBeGreaterThan(0); // …and the burst eventually trips it
    expect(statuses.every((status) => status === 201 || status === 429)).toBe(
      true,
    ); // never a 500
  });
});
