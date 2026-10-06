import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { db } from "@/lib/db";
import { invalidateSettings } from "@/lib/settings";

/**
 * Home-section server data path (round 4): the homepage notices feed,
 * support campaigns band and fatwa bank preview now read the DB through
 * shared server libs instead of fetching the public APIs client-side.
 * These tests pin that contract: flag-gating, curation order (pinned
 * first), computed campaign totals, and plain-text fatwa answers.
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

const { listNotices } = await import("@/lib/content/notices");
const { listCampaigns } = await import("@/lib/content/campaigns");
const { listFatwaPreview } = await import("@/lib/content/fatwa");

const stamp = Date.now();
const created = {
  noticeIds: [] as string[],
  fundId: "",
  campaignId: "",
  donationIds: [] as string[],
  fatwaIds: [] as string[],
  categoryIds: [] as string[],
};

beforeAll(async () => {
  // Flags default to ABSENT = enabled; create disabled rows per test below.
  const [noticeA, noticeB, noticeC, noticeD] = await Promise.all([
    db.notice.create({
      data: {
        slug: `test-pin-${stamp}`,
        titleBn: "পিন করা নোটিশ",
        titleEn: "Pinned notice",
        excerptBn: "বিজ্ঞপ্তি",
        excerptEn: "excerpt",
        category: "ADMISSION",
        status: "ACTIVE",
        pinned: true,
        publishedAt: new Date(Date.now() - 86_400_000),
      },
    }),
    db.notice.create({
      data: {
        slug: `test-new-${stamp}`,
        titleBn: "নতুন নোটিশ",
        titleEn: "Fresh notice",
        category: "ACADEMIC",
        status: "NEW",
        publishedAt: new Date(),
      },
    }),
    db.notice.create({
      data: {
        slug: `test-draft-${stamp}`,
        titleBn: "খসড়া",
        titleEn: "Draft (unpublished)",
        category: "GENERAL",
        isPublished: false,
      },
    }),
    db.notice.create({
      data: {
        slug: `test-future-${stamp}`,
        titleBn: "ভবিষ্যতের",
        titleEn: "Scheduled in the future",
        category: "RECRUITMENT",
        publishedAt: new Date(Date.now() + 86_400_000),
      },
    }),
  ]);
  created.noticeIds = [noticeA.id, noticeB.id, noticeC.id, noticeD.id];

  const fund = await db.fund.create({
    data: {
      key: `test-fund-${stamp}`,
      nameBn: "পরীক্ষা ফান্ড",
      nameEn: "Test fund",
      isDefault: true,
    },
  });
  created.fundId = fund.id;

  const campaign = await db.campaign.create({
    data: {
      slug: `test-campaign-${stamp}`,
      fundId: fund.id,
      titleBn: "পরীক্ষা ক্যাম্পেইন",
      titleEn: "Test campaign",
      goalAmount: 100_000,
      isPublished: true,
      sortOrder: 1,
    },
  });
  created.campaignId = campaign.id;

  // One COMPLETED (counted) + one PENDING (must NOT count) donation.
  const [paid, pending] = await Promise.all([
    db.donation.create({
      data: {
        trackingCode: `TEST-DN-${stamp}-A`,
        fundId: fund.id,
        campaignId: campaign.id,
        amount: 40_000,
        donorName: "দাতা",
        status: "COMPLETED",
      },
    }),
    db.donation.create({
      data: {
        trackingCode: `TEST-DN-${stamp}-B`,
        fundId: fund.id,
        campaignId: campaign.id,
        amount: 30_000,
        donorName: "অপেক্ষমাণ দাতা",
        status: "PENDING",
      },
    }),
  ]);
  created.donationIds = [paid.id, pending.id];

  const category = await db.fatwaCategory.create({
    data: { key: "ibadat", nameBn: "ইবাদত", nameEn: "Worship", sortOrder: 1 },
  });
  created.categoryIds.push(category.id);

  const fatwa = await db.fatwaEntry.create({
    data: {
      slug: `test-fatwa-${stamp}`,
      categoryId: category.id,
      questionBn: "পরীক্ষামূলক প্রশ্ন?",
      questionEn: "Test question?",
      answerBn: "<p>উত্তর <strong>দান</strong></p>",
      answerEn: "<p>An <strong>answer</strong></p>",
      answeredBy: "মুফতি পরীক্ষা",
      publishedAt: new Date(),
    },
  });
  created.fatwaIds.push(fatwa.id);
});

afterAll(async () => {
  invalidateSettings();
  await db.donation.deleteMany({ where: { id: { in: created.donationIds } } });
  await db.campaign.deleteMany({ where: { id: created.campaignId } });
  await db.fund.deleteMany({ where: { id: created.fundId } });
  await db.fatwaEntry.deleteMany({ where: { id: { in: created.fatwaIds } } });
  await db.fatwaCategory.deleteMany({ where: { id: { in: created.categoryIds } } });
  await db.notice.deleteMany({ where: { id: { in: created.noticeIds } } });
  await db.featureFlag.deleteMany({ where: { key: { in: ["notices", "donations", "fatwa"] } } });
});

describe("lib/content/notices — listNotices (home feed data path)", () => {
  test("published only, pinned first, DTO shape for the server component", async () => {
    const { items } = await listNotices({ pageSize: 12 });
    const mine = items.filter((n) => n.slug.includes(`-${stamp}`));
    expect(mine.map((n) => n.slug)).toEqual([`test-pin-${stamp}`, `test-new-${stamp}`]);
    const first = mine[0];
    expect(first.pinned).toBe(true);
    expect(first.title).toEqual({ bn: "পিন করা নোটিশ", en: "Pinned notice" });
    expect(["all", "admission", "academic", "recruitment", "general"]).toContain(first.category);
    expect(typeof first.publishedAt).toBe("string");
    expect(first.attachmentUrl).toBeNull();
  });

  test("feature flag off → empty feed (matches page + API behavior)", async () => {
    await db.featureFlag.upsert({
      where: { key: "notices" },
      create: { key: "notices", isEnabled: false, labelBn: "নোটিশ", labelEn: "Notices" },
      update: { isEnabled: false },
    });
    invalidateSettings();
    const { items, total } = await listNotices({ pageSize: 12 });
    expect(items).toEqual([]);
    expect(total).toBe(0);
    await db.featureFlag.update({ where: { key: "notices" }, data: { isEnabled: true } });
    invalidateSettings();
  });
});

describe("lib/content/campaigns — listCampaigns (home support band data path)", () => {
  test("raised = COMPLETED donations only (pending never counted)", async () => {
    const campaigns = await listCampaigns();
    const mine = campaigns.find((c) => c.slug === `test-campaign-${stamp}`);
    expect(mine).toBeDefined();
    expect(mine!.targetAmount).toBe(100_000);
    expect(mine!.raisedAmount).toBe(40_000); // NOT 70_000
    expect(mine!.currency).toBe("BDT");
    expect(mine!.active).toBe(true);
  });

  test("feature flag off → empty list", async () => {
    await db.featureFlag.upsert({
      where: { key: "donations" },
      create: { key: "donations", isEnabled: false, labelBn: "অনুদান", labelEn: "Donations" },
      update: { isEnabled: false },
    });
    invalidateSettings();
    expect(await listCampaigns()).toEqual([]);
    await db.featureFlag.update({ where: { key: "donations" }, data: { isEnabled: true } });
    invalidateSettings();
  });
});

describe("lib/content/fatwa — listFatwaPreview (home bank data path)", () => {
  test("published entries with plain-text answers (rich HTML stripped)", async () => {
    const entries = await listFatwaPreview(4);
    const mine = entries.find((e) => e.slug === `test-fatwa-${stamp}`);
    expect(mine).toBeDefined();
    expect(mine!.category).toBe("ibadat");
    expect(mine!.answer.bn).toBe("উত্তর দান"); // <p>/<strong> gone
    expect(mine!.question).toEqual({ bn: "পরীক্ষামূলক প্রশ্ন?", en: "Test question?" });
    expect(mine!.answeredBy).toBe("মুফতি পরীক্ষা");
  });

  test("feature flag off → empty preview", async () => {
    await db.featureFlag.upsert({
      where: { key: "fatwa" },
      create: { key: "fatwa", isEnabled: false, labelBn: "ফতোয়া", labelEn: "Fatwa" },
      update: { isEnabled: false },
    });
    invalidateSettings();
    expect(await listFatwaPreview(4)).toEqual([]);
    await db.featureFlag.update({ where: { key: "fatwa" }, data: { isEnabled: true } });
    invalidateSettings();
  });
});
