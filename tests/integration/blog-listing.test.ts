import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { db } from "@/lib/db";
import { listPostCategoryFacets, listPublishedPosts } from "@/lib/content/blog";

/**
 * Round 7 blog pagination — the /media/blog listing now reads through
 * listPublishedPosts (page-sliced, filter-aware) + listPostCategoryFacets
 * (chip counts). These tests pin that data contract against a real
 * PostgreSQL: newest-first ordering, full totals with sliced pages,
 * category filters by slug AND by Bengali name (a seeded category has an
 * empty slug), and the board visibility rule (unpublished, future-dated
 * and NEWS-kind rows never surface on the blog).
 */

const stamp = Date.now().toString(36);
const day = 86_400_000;
const base = new Date(Date.now() - 30 * day);

const slug = (name: string) => `bl-${name}-${stamp}`;

const CATEGORY_SLUG = slug("cat");
const CATEGORY_NAME_BN = `রাউন্ড-৭ নাম-শ্রেণি ${stamp}`;
const PUBLISHED_ARTICLES = 11; // pageSize 9 → 2 pages

let categoryId = "";
let nameCategoryId = "";
const createdPostIds: string[] = [];

beforeAll(async () => {
  const [category, nameCategory] = await Promise.all([
    db.postCategory.create({
      data: { slug: CATEGORY_SLUG, nameBn: `রাউন্ড-৭ শ্রেণি ${stamp}`, nameEn: "Round 7 category", sortOrder: 900 },
    }),
    db.postCategory.create({
      data: { slug: "", nameBn: CATEGORY_NAME_BN, nameEn: "Round 7 name-only category", sortOrder: 901 },
    }),
  ]);
  categoryId = category.id;
  nameCategoryId = nameCategory.id;

  // 11 published articles, deliberately NOT in insertion order (dates decide).
  const articles = Array.from({ length: PUBLISHED_ARTICLES }, (_, index) => ({
    slug: slug(`a${String(index).padStart(2, "0")}`),
    titleBn: `ব্লগ প্রবন্ধ ${index + 1}`,
    titleEn: `Blog article ${index + 1}`,
    excerptBn: "সারসংক্ষেপ",
    excerptEn: "Excerpt",
    kind: "ARTICLE" as const,
    isPublished: true,
    publishedAt: new Date(base.getTime() + index * day),
    categoryId: index < 3 ? categoryId : null,
  }));
  // visibility controls
  const controls = [
    { slug: slug("hidden"), titleBn: "অপ্রকাশিত", titleEn: "Unpublished", kind: "ARTICLE" as const, isPublished: false, publishedAt: new Date(base.getTime() + 40 * day) },
    { slug: slug("future"), titleBn: "ভবিষ্যতের", titleEn: "Future", kind: "ARTICLE" as const, isPublished: true, publishedAt: new Date(Date.now() + day) },
    // a published, past-dated NEWS post — excluded by kind alone
    { slug: slug("news"), titleBn: "সংবাদ পোস্ট", titleEn: "News post", kind: "NEWS" as const, isPublished: true, publishedAt: new Date(base.getTime() + 20 * day) },
  ];
  // name-only category article (category with empty slug) — the newest article
  const named = [
    { slug: slug("named"), titleBn: "নাম-শ্রেণির প্রবন্ধ", titleEn: "Name-category article", kind: "ARTICLE" as const, isPublished: true, publishedAt: new Date(base.getTime() + 12 * day), categoryId: nameCategoryId },
  ];

  const rows = await db.post.createMany({ data: [...articles, ...controls, ...named] });
  expect(rows.count).toBe(PUBLISHED_ARTICLES + controls.length + named.length);
  const created = await db.post.findMany({ where: { slug: { startsWith: `bl-` } }, select: { id: true, slug: true } });
  for (const row of created) if (row.slug.endsWith(stamp)) createdPostIds.push(row.id);
});

afterAll(async () => {
  await db.post.deleteMany({ where: { id: { in: createdPostIds } } });
  await db.postCategory.deleteMany({ where: { id: { in: [categoryId, nameCategoryId] } } });
});

describe("listPublishedPosts — paging + ordering", () => {
  test("page 1 slices the newest 9 with the full total and page count", async () => {
    const result = await listPublishedPosts({ page: 1, pageSize: 9 });
    expect(result.total).toBe(PUBLISHED_ARTICLES + 1); // + the name-category article
    expect(result.totalPages).toBe(2);
    expect(result.articles).toHaveLength(9);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(9);
  });

  test("newest first: page 1 starts with the latest-dated article", async () => {
    const result = await listPublishedPosts({ page: 1, pageSize: 9 });
    // the name-category article is the newest (base + 12 days)
    expect(result.articles[0]!.slug).toBe(slug("named"));
    expect(result.articles[1]!.slug).toBe(slug(`a${String(PUBLISHED_ARTICLES - 1).padStart(2, "0")}`));
  });

  test("page 2 returns the remainder, newest first", async () => {
    const result = await listPublishedPosts({ page: 2, pageSize: 9 });
    expect(result.articles).toHaveLength(3);
    expect(result.total).toBe(12);
    const slugs = result.articles.map((article) => article.slug);
    expect(slugs).toEqual([slug("a02"), slug("a01"), slug("a00")]);
  });

  test("unpublished, future-dated and NEWS posts never appear", async () => {
    const all = await listPublishedPosts({ page: 1, pageSize: 50 });
    const slugs = all.articles.map((article) => article.slug);
    expect(slugs).not.toContain(slug("hidden"));
    expect(slugs).not.toContain(slug("future"));
    expect(slugs).not.toContain(slug("news"));
  });

  test("out-of-range page returns an empty page with honest totals", async () => {
    const result = await listPublishedPosts({ page: 9, pageSize: 9 });
    expect(result.articles).toHaveLength(0);
    expect(result.total).toBe(12);
    expect(result.totalPages).toBe(2);
  });
});

describe("listPublishedPosts — category filters", () => {
  test("filters by PostCategory slug (clar- topic deep-links use this)", async () => {
    const result = await listPublishedPosts({ categorySlug: CATEGORY_SLUG, pageSize: 9 });
    expect(result.total).toBe(3);
    expect(result.articles).toHaveLength(3);
    expect(result.articles.every((article) => article.category.bn.includes("রাউন্ড-৭"))).toBe(true);
  });

  test("filters by Bengali category name (categories with empty slugs)", async () => {
    const result = await listPublishedPosts({ categoryName: CATEGORY_NAME_BN, pageSize: 9 });
    expect(result.total).toBe(1);
    expect(result.articles[0]!.slug).toBe(slug("named"));
  });

  test("unknown category slugs yield an empty listing (not an error)", async () => {
    const result = await listPublishedPosts({ categorySlug: `no-such-${stamp}`, pageSize: 9 });
    expect(result.total).toBe(0);
    expect(result.articles).toHaveLength(0);
    expect(result.totalPages).toBe(1);
  });
});

describe("listPostCategoryFacets — chip counts", () => {
  test("counts only published, visible ARTICLE posts per category", async () => {
    const facets = await listPostCategoryFacets();
    const bySlug = facets.find((facet) => facet.slug === CATEGORY_SLUG);
    expect(bySlug?.count).toBe(3);
    const byName = facets.find((facet) => facet.name.bn === CATEGORY_NAME_BN);
    expect(byName?.count).toBe(1);
    expect(byName?.slug).toBe("");
    // bilingual names serialize for both chip languages
    expect(byName?.name.en).toBe("Round 7 name-only category");
  });
});
