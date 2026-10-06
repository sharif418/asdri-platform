import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { db } from "@/lib/db";
import { invalidateSettings } from "@/lib/settings";

/**
 * Public notice permalinks (round 6): /notices/[slug] renders through
 * getNoticeBySlug + getNoticeNeighbors. These tests pin the data contract
 * the page depends on — publication/flag gating (an unpublished or
 * future-dated notice must be indistinguishable from a missing one),
 * field serialization, attachment URL derivation, and chronological
 * neighbour lookups used by the prev/next navigation.
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

const { getNoticeBySlug, getNoticeNeighbors } = await import("@/lib/content/notices");

const stamp = Date.now();
const created = { noticeIds: [] as string[], mediaId: "" };
const day = 86_400_000;

/** Slugs fixed for the neighbour chain (old → mid → new). */
const SLUG_OLD = `detail-old-${stamp}`;
const SLUG_MID = `detail-mid-${stamp}`;
const SLUG_NEW = `detail-new-${stamp}`;
const SLUG_HIDDEN = `detail-hidden-${stamp}`;
const SLUG_FUTURE = `detail-future-${stamp}`;
const MID_PUBLISHED_AT = new Date(Date.now() - day);

beforeAll(async () => {
  // Flags default to ABSENT = enabled (cleanup restores that).
  await db.featureFlag.deleteMany({ where: { key: "notices" } });

  const media = await db.media.create({
    data: {
      key: `2026/10/notice-att-${stamp}.pdf`,
      filename: "circular.pdf",
      mime: "application/pdf",
      size: 100,
      kind: "DOCUMENT",
    },
  });
  created.mediaId = media.id;

  const rows = await Promise.all([
    db.notice.create({
      data: {
        slug: SLUG_OLD,
        titleBn: "পুরনো নোটিশ",
        titleEn: "Older notice",
        category: "ACADEMIC",
        status: "CLOSED",
        publishedAt: new Date(MID_PUBLISHED_AT.getTime() - day),
      },
    }),
    db.notice.create({
      data: {
        slug: SLUG_MID,
        titleBn: "মাঝের নোটিশ",
        titleEn: "Middle notice",
        excerptBn: "নোটিশ সারসংক্ষেপ",
        excerptEn: "Notice excerpt",
        bodyBn: "<p>মূল <strong>বিজ্ঞপ্তি</strong></p>",
        bodyEn: "<p>Main <strong>notice</strong></p>",
        category: "ADMISSION",
        status: "NEW",
        pinned: true,
        attachmentMediaId: media.id,
        publishedAt: MID_PUBLISHED_AT,
      },
    }),
    db.notice.create({
      data: {
        slug: SLUG_NEW,
        titleBn: "নতুন নোটিশ",
        titleEn: "Newer notice",
        category: "GENERAL",
        status: "ACTIVE",
        publishedAt: new Date(MID_PUBLISHED_AT.getTime() + day),
      },
    }),
    // Unpublished and future-dated rows must be invisible to the public.
    db.notice.create({
      data: { slug: SLUG_HIDDEN, titleBn: "অপ্রকাশিত", titleEn: "Hidden", category: "GENERAL", publishedAt: MID_PUBLISHED_AT, isPublished: false },
    }),
    db.notice.create({
      data: { slug: SLUG_FUTURE, titleBn: "ভবিষ্যতের", titleEn: "Future", category: "GENERAL", publishedAt: new Date(Date.now() + day) },
    }),
  ]);
  created.noticeIds = rows.map((row) => row.id);
});

afterAll(async () => {
  invalidateSettings();
  await db.notice.deleteMany({ where: { id: { in: created.noticeIds } } });
  await db.media.deleteMany({ where: { id: created.mediaId } });
  await db.featureFlag.deleteMany({ where: { key: "notices" } });
  invalidateSettings();
});

describe("getNoticeBySlug (public permalink data)", () => {
  test("serialises a published notice with all fields the page renders", async () => {
    const notice = await getNoticeBySlug(SLUG_MID);
    expect(notice).not.toBeNull();
    expect(notice!.slug).toBe(SLUG_MID);
    expect(notice!.title).toEqual({ bn: "মাঝের নোটিশ", en: "Middle notice" });
    expect(notice!.excerpt.en).toBe("Notice excerpt");
    expect(notice!.body.bn).toContain("<strong>");
    expect(notice!.category).toBe("admission");
    expect(notice!.status).toBe("new");
    expect(notice!.pinned).toBe(true);
    expect(notice!.attachmentUrl).toBe(`/api/media/2026/10/notice-att-${stamp}.pdf`);
    expect(notice!.publishedAt).toBe(MID_PUBLISHED_AT.toISOString());
    expect(notice!.updatedAt).toBeTruthy();
  });

  test("unknown slug → null", async () => {
    expect(await getNoticeBySlug(`no-such-notice-${stamp}`)).toBeNull();
  });

  test("unpublished and future-dated notices are indistinguishable from missing (null)", async () => {
    expect(await getNoticeBySlug(SLUG_HIDDEN)).toBeNull();
    expect(await getNoticeBySlug(SLUG_FUTURE)).toBeNull();
  });

  test("notices flag off → null even for a published notice", async () => {
    await db.featureFlag.create({ data: { key: "notices", labelBn: "নোটিশ", labelEn: "Notices", isEnabled: false } });
    invalidateSettings();
    expect(await getNoticeBySlug(SLUG_MID)).toBeNull();
    await db.featureFlag.update({ where: { key: "notices" }, data: { isEnabled: true } });
    invalidateSettings();
    expect(await getNoticeBySlug(SLUG_MID)).not.toBeNull();
  });
});

describe("getNoticeNeighbors (prev/next navigation)", () => {
  test("middle notice: prev = older, next = newer (titles serialized)", async () => {
    const { prev, next } = await getNoticeNeighbors(MID_PUBLISHED_AT.toISOString());
    expect(prev?.slug).toBe(SLUG_OLD);
    expect(prev?.title).toEqual({ bn: "পুরনো নোটিশ", en: "Older notice" });
    expect(next?.slug).toBe(SLUG_NEW);
    expect(next?.title).toEqual({ bn: "নতুন নোটিশ", en: "Newer notice" });
  });

  test("oldest notice has no prev; newest has no next", async () => {
    const oldest = await getNoticeNeighbors(new Date(MID_PUBLISHED_AT.getTime() - day).toISOString());
    expect(oldest.prev).toBeNull();
    const newest = await getNoticeNeighbors(new Date(MID_PUBLISHED_AT.getTime() + day).toISOString());
    expect(newest.next).toBeNull();
  });

  test("unpublished and future-dated rows are skipped as neighbours", async () => {
    // Hidden sits at the same timestamp as MID; future is after NEW — neither
    // may surface in either direction.
    const { prev, next } = await getNoticeNeighbors(MID_PUBLISHED_AT.toISOString());
    expect(prev?.slug).not.toBe(SLUG_HIDDEN);
    expect(next?.slug).not.toBe(SLUG_FUTURE);
    expect(next?.slug).not.toBe(SLUG_HIDDEN);
  });
});
