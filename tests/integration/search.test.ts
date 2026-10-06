import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  searchAlbumEntries,
  searchCourseEntries,
  searchNoticeEntries,
  searchPersonEntries,
  searchPostEntries,
} from "@/lib/db-search";
import { searchPageDatabase, toNoticeResult } from "@/lib/search-view";

/**
 * Ranked full-text search against a real PostgreSQL (asdri_test, pre-migrated
 * with the tsvector columns): multi-word AND semantics, English
 * case-insensitivity (the historical /search bug), stemming, question-outranks-
 * answer weighting, category scope, and paging — asserted both at the lib
 * level and through the REAL GET /api/fatwa handler (in-process, no server).
 */

const { GET } = await import("@/app/api/fatwa/route");

const MARK = `srch${Date.now().toString(36)}`;

/** Deterministic slugs so cleanup never touches corpus rows. */
const slug = (name: string) => `${MARK}-${name}`;

const fatwas = [
  {
    // Both marker words, NON-contiguous (question carries one, answer the other).
    slug: slug("multi"),
    questionBn: `অনুসন্ধান-পরীক্ষা ${MARK} প্রশ্নাংশ কীবোর্ড শব্দ`,
    questionEn: "Probe question for the search suite",
    answerBn: "<p>উত্তরাংশে রয়েছে সমতল-শব্দ, যা প্রশ্নে নেই। নিসাব পরিমাণ ব্যাখ্যা।</p>",
    answerEn: "<p>Answer body mentions nothing relevant.</p>",
  },
  {
    // Only ONE of the two marker words — the AND control that must NOT match.
    slug: slug("single"),
    questionBn: `শুধু একটি মার্কার ${MARK} রয়েছে এই পংক্তিতে`,
    questionEn: "Control row with a single marker",
    answerBn: "<p>নিয়ন্ত্রণ উত্তর।</p>",
    answerEn: "<p>Control answer.</p>",
  },
  {
    // English stemming probe: text has "donate/donates", query will use "donations".
    slug: slug("stem"),
    questionBn: "ইংরেজি স্টেমিং পরীক্ষা",
    questionEn: `Dawrah ${MARK} ruling on behalf of donors`,
    answerBn: "<p>উত্তর।</p>",
    answerEn: "<p>It is encouraged to donate and to donate regularly.</p>",
  },
  {
    // Ranking probes: term in the QUESTION (A-weight) …
    slug: slug("rank-q"),
    questionBn: `ওজন-পরীক্ষা ক্রমমার্কার প্রশ্নে`,
    questionEn: "Ranking probe question",
    answerBn: "<p>সাধারণ উত্তর।</p>",
    answerEn: "<p>Plain answer.</p>",
  },
  {
    // … versus the same term only in the ANSWER (B-weight).
    slug: slug("rank-a"),
    questionBn: "ওজন-পরীক্ষা প্রশ্ন নয়",
    questionEn: "Ranking probe answer-only",
    answerBn: "<p>এখানেই ক্রমমার্কার শব্দটি উত্তরে আছে।</p>",
    answerEn: "<p>Plain answer.</p>",
  },
];

const notices = [
  {
    slug: slug("notice-en"),
    titleBn: "ইংরেজি শিরোনাম পরীক্ষা",
    titleEn: `Admission ${MARK} Circular`,
    excerptBn: "",
    excerptEn: "Lowercase admission probe",
    bodyBn: "",
    bodyEn: "<p>The notice body.</p>",
    category: "ADMISSION" as const,
  },
  {
    slug: slug("notice-bn"),
    titleBn: `সমতল-শব্দ ${MARK} বাংলা নোটিশ`,
    titleEn: "Bengali notice probe",
    excerptBn: "নিসাব সংক্রান্ত সংক্ষেপ",
    excerptEn: "",
    bodyBn: "<p>বিস্তারিত নোটিশ প্রসঙ্গ।</p>",
    bodyEn: "",
    category: "GENERAL" as const,
  },
];

function fatwaRequest(params: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/fatwa?${params}`);
}

interface FatwaListResponse {
  data: { items: { slug: string }[]; total: number; page: number; pageSize: number };
}

async function listFatwas(params: string): Promise<FatwaListResponse["data"]> {
  const res = await GET(fatwaRequest(params));
  expect(res.status).toBe(200);
  return ((await res.json()) as FatwaListResponse).data;
}

beforeAll(async () => {
  await db.fatwaEntry.createMany({
    data: fatwas.map((entry) => ({ ...entry, answeredBy: "বোর্ড", isPublished: true })),
  });
  await db.notice.createMany({ data: notices.map((notice) => ({ ...notice, isPublished: true })) });
});

afterAll(async () => {
  await db.fatwaEntry.deleteMany({ where: { slug: { startsWith: `${MARK}-` } } });
  await db.notice.deleteMany({ where: { slug: { startsWith: `${MARK}-` } } });
});

describe("GET /api/fatwa — ranked full-text search", () => {
  test("multi-word Bengali query matches non-contiguous tokens (AND, not substring)", async () => {
    const data = await listFatwas(`q=${encodeURIComponent(`${MARK} সমতল-শব্দ`)}`);
    expect(data.total).toBe(1);
    expect(data.items[0]?.slug).toBe(slug("multi"));
  });

  test("a single-token miss still excludes partial matches", async () => {
    // "single" carries the marker but NOT সমতল-শব্দ → AND excludes it.
    const data = await listFatwas(`q=${encodeURIComponent(`${MARK} অনুপস্থিত-শব্দ`)}`);
    expect(data.total).toBe(0);
    expect(data.items).toHaveLength(0);
  });

  test("English search is case-insensitive (the /search page bug)", async () => {
    const data = await listFatwas(`q=${encodeURIComponent(`dawrah ${MARK}`)}`);
    expect(data.total).toBe(1);
    expect(data.items[0]?.slug).toBe(slug("stem"));
  });

  test("English stemming collapses donations → donate", async () => {
    const data = await listFatwas(`q=${encodeURIComponent("donations")}`);
    const stems = data.items.filter((item) => item.slug.startsWith(`${MARK}-stem`));
    expect(stems).toHaveLength(1);
  });

  test("question hits outrank answer-only hits for the same term", async () => {
    const data = await listFatwas(`q=${encodeURIComponent("ক্রমমার্কার")}`);
    const ranked = data.items.filter((item) => item.slug.startsWith(`${MARK}-rank`));
    expect(ranked).toHaveLength(2);
    expect(ranked[0]?.slug).toBe(slug("rank-q"));
    expect(ranked[1]?.slug).toBe(slug("rank-a"));
  });

  test("paging reports the full ranked total while slicing the page", async () => {
    // MARK appears in: multi, single, stem — three rows (rank probes use their own marker).
    const data = await listFatwas(`q=${encodeURIComponent(MARK)}&page=1&pageSize=2`);
    expect(data.total).toBe(3);
    expect(data.items).toHaveLength(2);
    const page2 = await listFatwas(`q=${encodeURIComponent(MARK)}&page=2&pageSize=2`);
    expect(page2.items).toHaveLength(1);
    expect(page2.total).toBe(3);
  });
});

describe("searchNoticeEntries — lib level (the /search page path)", () => {
  test("lowercase English query finds the capitalised notice title", async () => {
    const result = await searchNoticeEntries({
      q: `admission ${MARK.toLowerCase()}`,
      skip: 0,
      take: 5,
    });
    expect(result.total).toBe(1);
    expect(result.mode).toBe("tsvector");
    const rows = await db.notice.findMany({
      where: { id: { in: result.ids } },
      select: { slug: true },
    });
    expect(rows[0]?.slug).toBe(slug("notice-en"));
  });

  test("Bengali multi-word matches title + excerpt across fields", async () => {
    const result = await searchNoticeEntries({ q: "সমতল-শব্দ নিসাব", skip: 0, take: 5 });
    const slugs = await db.notice
      .findMany({ where: { id: { in: result.ids } }, select: { slug: true } })
      .then((rows) => rows.map((row) => row.slug));
    expect(slugs).toContain(slug("notice-bn"));
  });

  test("HTML in bodies is stripped before tokenising (no <p> token matches)", async () => {
    const result = await searchNoticeEntries({ q: "p body", skip: 0, take: 5 });
    expect(result.total).toBe(0);
  });
});

/* ————————— Round 7: live content corpus + permalinks + flag gating ————————— */

describe("live content corpus — posts, courses, people, albums", () => {
  const day = 86_400_000;
  const publishedAt = new Date(Date.now() - day);

  beforeAll(async () => {
    await Promise.all([
      db.post.create({
        data: {
          slug: slug("post-live"),
          titleBn: `জীবন্ত পোস্ট ${MARK} শিরোনাম`,
          titleEn: `Live post ${MARK} headline`,
          excerptBn: "সারসংক্ষেপ",
          excerptEn: "Live post excerpt",
          kind: "ARTICLE",
          isPublished: true,
          publishedAt,
        },
      }),
      // AND-control: unpublished posts must never surface.
      db.post.create({
        data: {
          slug: slug("post-hidden"),
          titleBn: `অপ্রকাশিত ${MARK} পোস্ট`,
          titleEn: `Unpublished ${MARK} post`,
          kind: "ARTICLE",
          isPublished: false,
          publishedAt,
        },
      }),
      // Future-dated "published" post — same visibility rule as the board.
      db.post.create({
        data: {
          slug: slug("post-future"),
          titleBn: `ভবিষ্যতের ${MARK} পোস্ট`,
          titleEn: `Future ${MARK} post`,
          kind: "ARTICLE",
          isPublished: true,
          publishedAt: new Date(Date.now() + day),
        },
      }),
      db.post.create({
        data: {
          slug: slug("post-news"),
          titleBn: `সংবাদ ${MARK} ইভেন্ট`,
          titleEn: `News ${MARK} event`,
          kind: "NEWS",
          isPublished: true,
          publishedAt,
        },
      }),
      db.course.create({
        data: {
          code: `R7${Date.now().toString(36).slice(-4).toUpperCase()}`,
          slug: slug("course-live"),
          titleBn: `উপস্থিত কোর্স ${MARK}`,
          titleEn: `Present course ${MARK}`,
          taglineBn: "ট্যাগলাইন",
          taglineEn: "Course tagline",
          isPublished: true,
        },
      }),
      db.course.create({
        data: {
          code: `H7${Date.now().toString(36).slice(-4).toUpperCase()}`,
          slug: slug("course-hidden"),
          titleBn: `লুকানো কোর্স ${MARK}`,
          titleEn: `Hidden course ${MARK}`,
          isPublished: false,
        },
      }),
      db.person.create({
        data: {
          slug: slug("person-live"),
          nameBn: `শিক্ষক ${MARK} নাম`,
          nameEn: `Teacher ${MARK} name`,
          titleBn: "উস্তাজ",
          titleEn: "Ustadh",
          roleTitleBn: "সিনিয়র গবেষক",
          roleTitleEn: "Senior researcher",
          isPublished: true,
        },
      }),
      db.person.create({
        data: {
          slug: slug("person-hidden"),
          nameBn: `অদৃশ্য ${MARK} শিক্ষক`,
          nameEn: `Hidden ${MARK} teacher`,
          isPublished: false,
        },
      }),
      db.album.create({
        data: {
          slug: slug("album-live"),
          titleBn: `অ্যালবাম ${MARK} শীর্ষক`,
          titleEn: `Album ${MARK} title`,
          descriptionBn: "বর্ণনা",
          descriptionEn: "Album description",
          isPublished: true,
        },
      }),
      db.album.create({
        data: {
          slug: slug("album-hidden"),
          titleBn: `অপ্রকাশিত ${MARK} অ্যালবাম`,
          titleEn: `Unpublished ${MARK} album`,
          isPublished: false,
        },
      }),
    ]);
  });

  afterAll(async () => {
    await db.post.deleteMany({ where: { slug: { startsWith: `${MARK}-` } } });
    await db.course.deleteMany({ where: { slug: { startsWith: `${MARK}-` } } });
    await db.person.deleteMany({ where: { slug: { startsWith: `${MARK}-` } } });
    await db.album.deleteMany({ where: { slug: { startsWith: `${MARK}-` } } });
  });

  test("published ARTICLE posts match by Bengali and English title (case-insensitive)", async () => {
    const bn = await searchPostEntries(MARK.toLowerCase(), "bn");
    const article = bn.find((item) => item.href.endsWith(slug("post-live")));
    expect(article).toBeDefined();
    expect(article!.type).toBe("article");
    expect(article!.href).toBe(`/media/blog/${slug("post-live")}`);
    expect(article!.title).toContain(MARK);

    const en = await searchPostEntries(MARK.toLowerCase(), "en");
    const articleEn = en.find((item) => item.href.endsWith(slug("post-live")));
    expect(articleEn!.href).toBe(`/en/media/blog/${slug("post-live")}`);
    expect(articleEn!.title).toBe(`Live post ${MARK} headline`);
  });

  test("unpublished and future-dated posts are excluded", async () => {
    const results = await searchPostEntries(MARK, "bn");
    const hrefs = results.map((item) => item.href);
    expect(hrefs).not.toContain(`/media/blog/${slug("post-hidden")}`);
    expect(hrefs).not.toContain(`/media/blog/${slug("post-future")}`);
  });

  test("NEWS posts surface as news entries pointing at the news page", async () => {
    const results = await searchPostEntries(MARK, "bn");
    const news = results.find((item) => item.href.endsWith("/media/news"));
    expect(news).toBeDefined();
    expect(news!.type).toBe("news");
    expect(news!.title).toContain("সংবাদ");
    const en = await searchPostEntries(MARK, "en");
    expect(en.find((item) => item.type === "news")!.href).toBe("/en/media/news");
  });

  test("published courses match with /academics/courses/[slug] hrefs", async () => {
    const bn = await searchCourseEntries(MARK, "bn");
    const course = bn.find((item) => item.href.endsWith(slug("course-live")));
    expect(course).toBeDefined();
    expect(course!.href).toBe(`/academics/courses/${slug("course-live")}`);
    expect(course!.title).toContain("উপস্থিত কোর্স");
    expect(bn.find((item) => item.href.endsWith(slug("course-hidden")))).toBeUndefined();

    const en = await searchCourseEntries(MARK, "en");
    expect(en.find((item) => item.href.endsWith(slug("course-live")))!.href).toBe(
      `/en/academics/courses/${slug("course-live")}`,
    );
  });

  test("published faculty match by name and link the faculty directory", async () => {
    const bn = await searchPersonEntries(MARK, "bn");
    const person = bn.find((item) => item.id === `person:${slug("person-live")}`);
    expect(person).toBeDefined();
    expect(person!.href).toBe("/academics/faculty");
    expect(person!.excerpt).toBe("সিনিয়র গবেষক");
    expect(bn.find((item) => item.id === `person:${slug("person-hidden")}`)).toBeUndefined();

    const en = await searchPersonEntries(MARK, "en");
    const personEn = en.find((item) => item.id === `person:${slug("person-live")}`);
    expect(personEn!.href).toBe("/en/academics/faculty");
    expect(personEn!.title).toBe(`Teacher ${MARK} name`);
  });

  test("published albums match by title and link the gallery", async () => {
    const bn = await searchAlbumEntries(MARK, "bn");
    const album = bn.find((item) => item.id === `album:${slug("album-live")}`);
    expect(album).toBeDefined();
    expect(album!.href).toBe("/media/gallery");
    expect(bn.find((item) => item.id === `album:${slug("album-hidden")}`)).toBeUndefined();

    const en = await searchAlbumEntries(MARK, "en");
    expect(en.find((item) => item.id === `album:${slug("album-live")}`)!.href).toBe("/en/media/gallery");
  });

  test("searchPageDatabase gates posts/albums behind blog/gallery flags (fail-open)", async () => {
    const gated = await searchPageDatabase(MARK, "bn", new Map([["blog", false], ["gallery", false]]));
    expect(gated.posts).toHaveLength(0);
    expect(gated.albums).toHaveLength(0);
    // ungated modules still contribute
    expect(gated.courses.length).toBeGreaterThanOrEqual(1);
    expect(gated.people.length).toBeGreaterThanOrEqual(1);

    const open = await searchPageDatabase(MARK, "bn", new Map());
    expect(open.posts.length).toBeGreaterThanOrEqual(2); // article + news
    expect(open.albums).toHaveLength(1);

    const nullFlags = await searchPageDatabase(MARK, "bn", null);
    expect(nullFlags.posts.length).toBeGreaterThanOrEqual(2);
  });
});

describe("toNoticeResult — search results point at permalinks", () => {
  test("href is the /notices/[slug] permalink in both languages", async () => {
    const row = {
      id: "n1",
      slug: slug("notice-en"),
      titleBn: "বাংলা শিরোনাম",
      titleEn: "English title",
      excerptBn: "সারসংক্ষেপ",
      excerptEn: "Excerpt",
      publishedAt: new Date("2026-01-15T00:00:00Z"),
    };
    const bn = toNoticeResult(row, "bn");
    expect(bn.href).toBe(`/notices/${slug("notice-en")}`);
    expect(bn.href).not.toContain("?notice=");
    expect(bn.title).toBe("বাংলা শিরোনাম");

    const en = toNoticeResult(row, "en");
    expect(en.href).toBe(`/en/notices/${slug("notice-en")}`);
    expect(en.title).toBe("English title");
  });

  test("the live notice hydrates through searchPageDatabase with the permalink mapping", async () => {
    const results = await searchPageDatabase(`admission ${MARK.toLowerCase()}`, "bn", null);
    const notice = results.notices.find((row) => row.slug === slug("notice-en"));
    expect(notice).toBeDefined();
    const card = toNoticeResult(notice!, "bn");
    expect(card.href).toBe(`/notices/${slug("notice-en")}`);
  });
});
