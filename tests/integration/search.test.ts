import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { searchNoticeEntries } from "@/lib/db-search";

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
