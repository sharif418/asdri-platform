import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /feed.xml (round 7): RSS 2.0 with notice permalinks — every item links
 * to /notices/[slug] (both language variants) and carries it as a permanent
 * guid; atom:link rel="self", per-language channel metadata, XML escaping of
 * interpolated text (& < > " '), and the board visibility rule (unpublished
 * and future-dated notices excluded). The handler is exercised in-process
 * with a real PostgreSQL (asdri_test).
 */

const { GET } = await import("@/app/feed.xml/route");

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://assunnahinstitute.org";
const stamp = Date.now();
const day = 86_400_000;

/** Deterministic slugs so cleanup never touches corpus rows. */
const slug = (name: string) => `feed-${name}-${stamp}`;

const SLUG_AMP = slug("amp");
const SLUG_PLAIN = slug("plain");
const SLUG_HIDDEN = slug("hidden");
const SLUG_FUTURE = slug("future");

let ampId = "";
let plainId = "";
let hiddenId = "";
let futureId = "";

beforeAll(async () => {
  const rows = await Promise.all([
    db.notice.create({
      data: {
        slug: SLUG_AMP,
        titleBn: "ভর্তি ও নিয়োগ & বৃত্তি বিজ্ঞপ্তি",
        titleEn: "Admission & Recruitment Circular",
        excerptBn: "অনুসন্ধান পরীক্ষা — সারসংক্ষেপ & বিস্তারিত",
        excerptEn: "Feed test excerpt & details",
        category: "ADMISSION",
        publishedAt: new Date(Date.now() - 2 * day),
      },
    }),
    db.notice.create({
      data: {
        slug: SLUG_PLAIN,
        titleBn: "সাধারণ বিজ্ঞপ্তি",
        titleEn: "General notice",
        excerptBn: "সাধারণ সারসংক্ষেপ",
        excerptEn: "General excerpt",
        category: "GENERAL",
        publishedAt: new Date(Date.now() - day),
      },
    }),
    db.notice.create({
      data: {
        slug: SLUG_HIDDEN,
        titleBn: "অপ্রকাশিত ফিড পরীক্ষা",
        titleEn: "Unpublished feed probe",
        category: "GENERAL",
        isPublished: false,
        publishedAt: new Date(Date.now() - 3 * day),
      },
    }),
    db.notice.create({
      data: {
        slug: SLUG_FUTURE,
        titleBn: "ভবিষ্যতের ফিড পরীক্ষা",
        titleEn: "Future feed probe",
        category: "GENERAL",
        publishedAt: new Date(Date.now() + day),
      },
    }),
  ]);
  ampId = rows[0].id;
  plainId = rows[1].id;
  hiddenId = rows[2].id;
  futureId = rows[3].id;
});

afterAll(async () => {
  await db.notice.deleteMany({ where: { id: { in: [ampId, plainId, hiddenId, futureId] } } });
});

function feedRequest(query = ""): NextRequest {
  return new NextRequest(`http://localhost:3000/feed.xml${query}`);
}

describe("GET /feed.xml — Bangla default", () => {
  test("responds 200 with the RSS content type", async () => {
    const res = await GET(feedRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/rss+xml");
    expect(res.headers.get("cache-control")).toContain("s-maxage=600");
  });

  test("items link to /notices/[slug] permalinks with permanent guids", async () => {
    const xml = await GET(feedRequest()).then((res) => res.text());
    for (const s of [SLUG_AMP, SLUG_PLAIN]) {
      expect(xml).toContain(`<link>${SITE}/notices/${s}</link>`);
      expect(xml).toContain(`<guid isPermaLink="true">${SITE}/notices/${s}</guid>`);
    }
    // the old dialog deep-link must be gone
    expect(xml).not.toContain("notices?notice=");
    expect(xml).not.toContain('<guid isPermaLink="false">');
  });

  test("channel carries atom:link rel=self, bn-BD language and title", async () => {
    const xml = await GET(feedRequest()).then((res) => res.text());
    expect(xml).toContain(`<atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>`);
    expect(xml).toContain("<language>bn-BD</language>");
    expect(xml).toContain("<link>" + SITE + "/notices</link>");
  });

  test("interpolated text is XML-escaped (& → &amp;)", async () => {
    const xml = await GET(feedRequest()).then((res) => res.text());
    expect(xml).toContain("<title>ভর্তি ও নিয়োগ &amp; বৃত্তি বিজ্ঞপ্তি</title>");
    expect(xml).toContain("<description>অনুসন্ধান পরীক্ষা — সারসংক্ষেপ &amp; বিস্তারিত</description>");
    // raw ampersands must only survive inside the XML declaration/namespace-free text
    expect(xml.replace(/&amp;/g, "").replace(/&quot;/g, "").replace(/&apos;/g, "").replace(/&lt;/g, "").replace(/&gt;/g, "")).not.toContain("&");
  });

  test("unpublished and future-dated notices are excluded", async () => {
    const xml = await GET(feedRequest()).then((res) => res.text());
    expect(xml).not.toContain(SLUG_HIDDEN);
    expect(xml).not.toContain(SLUG_FUTURE);
    expect(xml).toContain(SLUG_AMP);
    expect(xml).toContain(SLUG_PLAIN);
  });
});

describe("GET /feed.xml?lang=en — English variant", () => {
  test("switches channel language, title and item links to /en", async () => {
    const xml = await GET(feedRequest("?lang=en")).then((res) => res.text());
    expect(xml).toContain("<language>en</language>");
    expect(xml).toContain("Notice Board");
    expect(xml).toContain(`<link>${SITE}/en/notices</link>`);
    expect(xml).toContain(`<atom:link href="${SITE}/feed.xml?lang=en" rel="self" type="application/rss+xml"/>`);
    expect(xml).toContain(`<link>${SITE}/en/notices/${SLUG_AMP}</link>`);
    expect(xml).toContain(`<guid isPermaLink="true">${SITE}/en/notices/${SLUG_PLAIN}</guid>`);
  });

  test("renders English titles and excerpts with escaping", async () => {
    const xml = await GET(feedRequest("?lang=en")).then((res) => res.text());
    expect(xml).toContain("<title>Admission &amp; Recruitment Circular</title>");
    expect(xml).toContain("<description>Feed test excerpt &amp; details</description>");
    expect(xml).not.toContain("<title>সাধারণ বিজ্ঞপ্তি</title>");
  });

  test("unknown lang values fall back to the Bangla feed", async () => {
    const xml = await GET(feedRequest("?lang=fr")).then((res) => res.text());
    expect(xml).toContain("<language>bn-BD</language>");
    expect(xml).toContain(`<link>${SITE}/notices/${SLUG_PLAIN}</link>`);
  });
});
