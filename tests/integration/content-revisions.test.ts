import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { installCookieMock, forgeCookie, newToken, tokenHash } from "../helpers/auth-forge";

/**
 * Round 4, workstream 5 — content revision history + preview-before-publish.
 *
 *   1. Notice updates through the real PATCH handler capture revisions
 *      (actor, trimmed before/after, 500-char field cap, changed-field set).
 *   2. History is capped at the latest 50 per item (52 direct rows + one
 *      update → exactly 50 remain, newest first).
 *   3. Post updates capture revisions too.
 *   4. Preview tokens: HMAC sign/verify roundtrip, 24h expiry (both sides),
 *      tampered signature/payload refused, wrong entity refused even with a
 *      genuine MAC; drafts render through the preview loaders while the
 *      public loaders keep returning null (permalink 404 stays).
 *   5. The two admin APIs: /api/admin/preview-link (POST, content.manage +
 *      CSRF) and /api/admin/revisions (GET, content.manage) with their
 *      401/403/400/404 guards.
 *
 * Self-contained fixtures (the test DB is migrated but NOT seeded): notice,
 * post and staff rows are created here, sessions forged like
 * library-admin.test.ts does.
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

const setCookie = installCookieMock();
// Route handlers imported AFTER the cookie mock is installed.
const { PATCH: PATCH_NOTICE } = await import("@/app/api/admin/notices/[id]/route");
const { PATCH: PATCH_POST } = await import("@/app/api/admin/posts/[id]/route");
const { GET: GET_REVISIONS } = await import("@/app/api/admin/revisions/route");
const { POST: POST_PREVIEW_LINK } = await import("@/app/api/admin/preview-link/route");
const { signPreviewToken, verifyPreviewToken, PREVIEW_TTL_MS } = await import("@/lib/preview-link");
const { getNoticeForPreview, getNoticeBySlug } = await import("@/lib/content/notices");
const { getPostForPreview, getArticleBySlug } = await import("@/lib/content/blog");
const { listContentRevisions } = await import("@/lib/content-revisions");

const CSRF = "csrf-rev-test-1";
const stamp = Date.now();
const day = 86_400_000;

const SLUG_NOTICE_A = `rev-notice-a-${stamp}`;
const SLUG_NOTICE_B = `rev-notice-b-${stamp}`;
const SLUG_NOTICE_DRAFT = `rev-notice-draft-${stamp}`;
const SLUG_POST_A = `rev-post-a-${stamp}`;
const SLUG_POST_DRAFT = `rev-post-draft-${stamp}`;

interface StaffSession {
  userId: string;
  sessionId: string;
  token: string;
}

async function createStaffSession(role: "EDITOR" | "LIBRARIAN", label: string): Promise<StaffSession> {
  const email = `${label}-${stamp}-${Math.floor(Math.random() * 1000)}@test.local`;
  const user = await db.user.create({
    data: { email, name: `সংশোধন পরীক্ষা ${label}`, role, passwordHash: hashPassword("password-12345") },
  });
  const token = newToken();
  const session = await db.session.create({
    data: {
      userId: user.id,
      tokenHash: tokenHash(token),
      csrfToken: CSRF,
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  return { userId: user.id, sessionId: session.id, token };
}

function actAs(staff: StaffSession): void {
  setCookie(forgeCookie(staff.sessionId, staff.token));
}

function jsonRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json", "x-csrf-token": CSRF },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

function getRequest(url: string): NextRequest {
  return new NextRequest(url, { method: "GET", headers: { "x-csrf-token": CSRF } });
}

/** Craft a token with a GENUINE MAC over an arbitrary payload (wrong-entity probe). */
function craftSignedToken(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const mac = createHmac("sha256", process.env.SESSION_SECRET!).update(body).digest("base64url");
  return `${body}.${mac}`;
}

let editor: StaffSession;
let librarian: StaffSession;
let noticeAId = "";
let noticeBId = "";
let draftNoticeId = "";
let postAId = "";
let draftPostId = "";
const fixtureUserIds: string[] = [];

beforeAll(async () => {
  editor = await createStaffSession("EDITOR", "editor");
  librarian = await createStaffSession("LIBRARIAN", "librarian");
  fixtureUserIds.push(editor.userId, librarian.userId);

  const [noticeA, noticeB, draftNotice, postA, draftPost] = await Promise.all([
    db.notice.create({
      data: {
        slug: SLUG_NOTICE_A,
        titleBn: "মূল শিরোনাম",
        titleEn: "Original title",
        excerptBn: "মূল সারসংক্ষেপ",
        bodyBn: "<p>মূল বিজ্ঞপ্তি</p>",
        category: "ADMISSION",
        status: "NEW",
        publishedAt: new Date(Date.now() - day),
      },
    }),
    db.notice.create({
      data: {
        slug: SLUG_NOTICE_B,
        titleBn: "ক্যাপ পরীক্ষা নোটিশ",
        titleEn: "Cap test notice",
        category: "GENERAL",
        status: "ACTIVE",
        publishedAt: new Date(Date.now() - day),
      },
    }),
    db.notice.create({
      data: {
        slug: SLUG_NOTICE_DRAFT,
        titleBn: "অপ্রকাশিত ড্রাফট নোটিশ",
        titleEn: "Unpublished draft notice",
        excerptBn: "ড্রাফট সারসংক্ষেপ",
        bodyBn: "<p>ড্রাফট <strong>বিজ্ঞপ্তির</strong> মূল অংশ</p>",
        category: "ACADEMIC",
        status: "NEW",
        isPublished: false,
        publishedAt: new Date(Date.now() - day),
      },
    }),
    db.post.create({
      data: {
        slug: SLUG_POST_A,
        titleBn: "মূল পোস্ট শিরোনাম",
        titleEn: "Original post",
        bodyBn: "<p>মূল পোস্ট</p>",
        kind: "ARTICLE",
        isPublished: true,
        publishedAt: new Date(Date.now() - day),
      },
    }),
    db.post.create({
      data: {
        slug: SLUG_POST_DRAFT,
        titleBn: "অপ্রকাশিত ড্রাফট পোস্ট",
        titleEn: "Unpublished draft post",
        bodyBn: "<p>ড্রাফট পোস্টের <em>মূল</em> অংশ</p>",
        kind: "ARTICLE",
        isPublished: false,
      },
    }),
  ]);
  noticeAId = noticeA.id;
  noticeBId = noticeB.id;
  draftNoticeId = draftNotice.id;
  postAId = postA.id;
  draftPostId = draftPost.id;
});

afterAll(async () => {
  await db.contentRevision.deleteMany({
    where: { entity: { in: ["Notice", "Post"] }, entityId: { in: [noticeAId, noticeBId, draftNoticeId, postAId, draftPostId] } },
  });
  await db.notice.deleteMany({ where: { id: { in: [noticeAId, noticeBId, draftNoticeId] } } });
  await db.post.deleteMany({ where: { id: { in: [postAId, draftPostId] } } });
  await db.session.deleteMany({ where: { userId: { in: fixtureUserIds } } });
  await db.user.deleteMany({ where: { id: { in: fixtureUserIds } } });
});

/* ————————————— 1 + 2: notice revisions through the real handler ————————————— */

describe("notice update revisions (real PATCH handler)", () => {
  test("two updates → two revisions with actor and correct before/after chain", async () => {
    actAs(editor);

    const first = await PATCH_NOTICE(
      jsonRequest(`http://local/api/admin/notices/${noticeAId}`, "PATCH", { titleBn: "দ্বিতীয় শিরোনাম" }),
      { params: Promise.resolve({ id: noticeAId }) },
    );
    expect(first.status).toBe(200);

    const second = await PATCH_NOTICE(
      jsonRequest(`http://local/api/admin/notices/${noticeAId}`, "PATCH", { titleBn: "তৃতীয় শিরোনাম", status: "ACTIVE" }),
      { params: Promise.resolve({ id: noticeAId }) },
    );
    expect(second.status).toBe(200);

    const rows = await db.contentRevision.findMany({
      where: { entity: "Notice", entityId: noticeAId },
      orderBy: { createdAt: "asc" },
    });
    expect(rows.length).toBe(2);

    // First revision: original → first change.
    const firstBefore = rows[0].before as Record<string, unknown>;
    const firstAfter = rows[0].after as Record<string, unknown>;
    expect(firstBefore.titleBn).toBe("মূল শিরোনাম");
    expect(firstAfter.titleBn).toBe("দ্বিতীয় শিরোনাম");
    expect(rows[0].actorId).toBe(editor.userId);
    // A title-only PATCH must not wipe unspecified fields (zod's create-side
    // defaults leaking through .partial() used to blank the body and flip
    // isPublished) — in the row AND in the recorded snapshot.
    const afterRow = await db.notice.findUniqueOrThrow({ where: { id: noticeAId } });
    expect(afterRow.bodyBn).toBe("<p>মূল বিজ্ঞপ্তি</p>");
    expect(afterRow.isPublished).toBe(true);
    expect(firstBefore.bodyBn).toBe("<p>মূল বিজ্ঞপ্তি</p>");
    expect(firstAfter.bodyBn).toBe("<p>মূল বিজ্ঞপ্তি</p>");

    // Second revision: first change → second change.
    const secondBefore = rows[1].before as Record<string, unknown>;
    const secondAfter = rows[1].after as Record<string, unknown>;
    expect(secondBefore.titleBn).toBe("দ্বিতীয় শিরোনাম");
    expect(secondAfter.titleBn).toBe("তৃতীয় শিরোনাম");
    expect(secondBefore.status).toBe("NEW");
    expect(secondAfter.status).toBe("ACTIVE");
    expect(rows[1].actorId).toBe(editor.userId);

    // The serialized list knows which fields changed.
    const listed = await listContentRevisions("Notice", noticeAId, 20);
    expect(listed.length).toBe(2);
    expect(listed[0].changed).toContain("titleBn");
    expect(listed[0].changed).toContain("status");
    expect(listed[0].actor?.name).toBe("সংশোধন পরীক্ষা editor");
  });

  test("each stored field is capped at 500 characters", async () => {
    actAs(editor);
    const longBody = `<p>${"ল".repeat(900)}</p>`;

    const res = await PATCH_NOTICE(
      jsonRequest(`http://local/api/admin/notices/${noticeAId}`, "PATCH", { bodyBn: longBody }),
      { params: Promise.resolve({ id: noticeAId }) },
    );
    expect(res.status).toBe(200);

    const newest = await db.contentRevision.findFirst({
      where: { entity: "Notice", entityId: noticeAId },
      orderBy: { createdAt: "desc" },
    });
    const after = newest?.after as Record<string, unknown>;
    expect(typeof after.bodyBn).toBe("string");
    expect((after.bodyBn as string).length).toBe(500);
  });

  test("history is trimmed to the latest 50 (52 direct rows + one update)", async () => {
    // 52 revisions planted directly, newest last.
    await db.contentRevision.createMany({
      data: Array.from({ length: 52 }, (_, index) => ({
        entity: "Notice",
        entityId: noticeBId,
        actorId: null,
        before: { titleBn: `আগে ${index}` },
        after: { titleBn: `পরে ${index}` },
      })),
    });
    expect(await db.contentRevision.count({ where: { entity: "Notice", entityId: noticeBId } })).toBe(52);

    actAs(editor);
    const res = await PATCH_NOTICE(
      jsonRequest(`http://local/api/admin/notices/${noticeBId}`, "PATCH", { titleBn: "ক্যাপের পরে নতুন শিরোনাম" }),
      { params: Promise.resolve({ id: noticeBId }) },
    );
    expect(res.status).toBe(200);

    // 52 planted + 1 from the update = 53 → trimmed to the latest 50.
    const total = await db.contentRevision.count({ where: { entity: "Notice", entityId: noticeBId } });
    expect(total).toBe(50);

    // The newest surviving revision is the one the update just wrote.
    const listed = await listContentRevisions("Notice", noticeBId, 20);
    expect(listed[0].after?.titleBn).toBe("ক্যাপের পরে নতুন শিরোনাম");
    expect(listed[0].actor?.name).toBe("সংশোধন পরীক্ষা editor");
    // …and the API caps the list itself at 20.
    expect(listed.length).toBe(20);
  });
});

/* ————————————— 3: post revisions ————————————— */

describe("post update revisions (real PATCH handler)", () => {
  test("update captures a revision with before/after content fields", async () => {
    actAs(editor);
    const res = await PATCH_POST(
      jsonRequest(`http://local/api/admin/posts/${postAId}`, "PATCH", { titleBn: "নতুন পোস্ট শিরোনাম", isPublished: false }),
      { params: Promise.resolve({ id: postAId }) },
    );
    expect(res.status).toBe(200);

    const rows = await db.contentRevision.findMany({ where: { entity: "Post", entityId: postAId } });
    expect(rows.length).toBe(1);
    const before = rows[0].before as Record<string, unknown>;
    const after = rows[0].after as Record<string, unknown>;
    expect(before.titleBn).toBe("মূল পোস্ট শিরোনাম");
    expect(after.titleBn).toBe("নতুন পোস্ট শিরোনাম");
    expect(before.isPublished).toBe(true);
    expect(after.isPublished).toBe(false);
    expect(rows[0].actorId).toBe(editor.userId);
    // Post snapshots carry the category link + publish stamp, not notice status.
    expect(before).toHaveProperty("categoryId");
    expect(before).toHaveProperty("publishedAt");
    expect(before).not.toHaveProperty("status");
  });
});

/* ————————————— 4: preview tokens ————————————— */

describe("preview token sign/verify", () => {
  test("roundtrip: valid token verifies with entity, entityId and a ~24h expiry", () => {
    const before = Date.now();
    const token = signPreviewToken("Notice", draftNoticeId);
    const payload = verifyPreviewToken(token);
    const after = Date.now();

    expect(payload).not.toBeNull();
    expect(payload!.entity).toBe("Notice");
    expect(payload!.entityId).toBe(draftNoticeId);
    // exp lands inside (now, now+24h] regardless of ms rounding.
    expect(payload!.exp * 1000).toBeGreaterThan(before);
    expect(payload!.exp * 1000).toBeLessThanOrEqual(after + PREVIEW_TTL_MS);
  });

  test("24h expiry: signing 25h ago fails now; a valid token fails 25h later", () => {
    const stale = signPreviewToken("Notice", draftNoticeId, Date.now() - 25 * 60 * 60 * 1000);
    expect(verifyPreviewToken(stale)).toBeNull();

    const fresh = signPreviewToken("Notice", draftNoticeId);
    expect(verifyPreviewToken(fresh, Date.now() + 25 * 60 * 60 * 1000)).toBeNull();
  });

  test("tampered signature is refused", () => {
    const token = signPreviewToken("Notice", draftNoticeId);
    const [body, mac] = token.split(".");
    const flipped = mac.slice(0, -1) + (mac.endsWith("A") ? "B" : "A");
    expect(verifyPreviewToken(`${body}.${flipped}`)).toBeNull();
  });

  test("tampered payload with the original signature is refused", () => {
    const token = signPreviewToken("Notice", draftNoticeId);
    const [body, mac] = token.split(".");
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<string, unknown>;
    payload.entityId = "someone-elses-id";
    const forgedBody = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    expect(verifyPreviewToken(`${forgedBody}.${mac}`)).toBeNull();
  });

  test("a genuinely-signed token for a non-previewable entity is refused", () => {
    const token = craftSignedToken({
      entity: "LibraryItem",
      entityId: "whatever",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    expect(verifyPreviewToken(token)).toBeNull();
  });

  test("garbage tokens are refused", () => {
    expect(verifyPreviewToken("")).toBeNull();
    expect(verifyPreviewToken("abc")).toBeNull();
    expect(verifyPreviewToken("a.b.c")).toBeNull();
    expect(verifyPreviewToken(".")).toBeNull();
  });

  test("drafts render through the preview loaders, never through the public ones", async () => {
    // Notice: preview loader returns the draft; the public permalink data
    // source stays null (the page 404s).
    const preview = await getNoticeForPreview(draftNoticeId);
    expect(preview).not.toBeNull();
    expect(preview!.title.bn).toBe("অপ্রকাশিত ড্রাফট নোটিশ");
    expect(preview!.body.bn).toContain("<strong>");
    expect(await getNoticeBySlug(SLUG_NOTICE_DRAFT)).toBeNull();

    // Post: same split.
    const postPreview = await getPostForPreview(draftPostId);
    expect(postPreview).not.toBeNull();
    expect(postPreview!.title.bn).toBe("অপ্রকাশিত ড্রাফট পোস্ট");
    expect(await getArticleBySlug(SLUG_POST_DRAFT)).toBeNull();
  });
});

/* ————————————— 5: the two admin APIs ————————————— */

describe("POST /api/admin/preview-link", () => {
  test("content staff get a signed URL that verifies back to the row", async () => {
    actAs(editor);
    const res = await POST_PREVIEW_LINK(
      jsonRequest("http://local/api/admin/preview-link", "POST", { entity: "Notice", entityId: draftNoticeId }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; data: { url: string; expiresAt: string } };
    expect(json.ok).toBe(true);
    expect(json.data.url.startsWith("/preview/")).toBe(true);
    expect(json.data.expiresAt).toBeTruthy();

    const payload = verifyPreviewToken(json.data.url.slice("/preview/".length));
    expect(payload?.entity).toBe("Notice");
    expect(payload?.entityId).toBe(draftNoticeId);
  });

  test("anonymous → 401; LIBRARIAN (no content.manage) → 403", async () => {
    setCookie(undefined);
    const anon = await POST_PREVIEW_LINK(
      jsonRequest("http://local/api/admin/preview-link", "POST", { entity: "Notice", entityId: draftNoticeId }),
    );
    expect(anon.status).toBe(401);

    actAs(librarian);
    const forbidden = await POST_PREVIEW_LINK(
      jsonRequest("http://local/api/admin/preview-link", "POST", { entity: "Notice", entityId: draftNoticeId }),
    );
    expect(forbidden.status).toBe(403);
  });

  test("unknown entity → 400; missing row → 404", async () => {
    actAs(editor);
    const badEntity = await POST_PREVIEW_LINK(
      jsonRequest("http://local/api/admin/preview-link", "POST", { entity: "LibraryItem", entityId: "x" }),
    );
    expect(badEntity.status).toBe(400);

    const missing = await POST_PREVIEW_LINK(
      jsonRequest("http://local/api/admin/preview-link", "POST", { entity: "Notice", entityId: "no-such-row" }),
    );
    expect(missing.status).toBe(404);
  });
});

describe("GET /api/admin/revisions", () => {
  test("content staff get the latest revisions with actor names", async () => {
    actAs(editor);
    const res = await GET_REVISIONS(
      getRequest(`http://local/api/admin/revisions?entity=Notice&entityId=${noticeAId}`),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; data: { revisions: { actor: { name: string } | null; changed: string[] }[] } };
    expect(json.ok).toBe(true);
    expect(json.data.revisions.length).toBeGreaterThanOrEqual(3);
    expect(json.data.revisions[0].actor?.name).toBe("সংশোধন পরীক্ষা editor");
    expect(json.data.revisions[0].changed).toContain("bodyBn");
  });

  test("anonymous → 401; LIBRARIAN → 403; bad query → 400", async () => {
    setCookie(undefined);
    const anon = await GET_REVISIONS(getRequest(`http://local/api/admin/revisions?entity=Notice&entityId=${noticeAId}`));
    expect(anon.status).toBe(401);

    actAs(librarian);
    const forbidden = await GET_REVISIONS(getRequest(`http://local/api/admin/revisions?entity=Notice&entityId=${noticeAId}`));
    expect(forbidden.status).toBe(403);

    actAs(editor);
    const bad = await GET_REVISIONS(getRequest("http://local/api/admin/revisions?entity=Team&entityId=x"));
    expect(bad.status).toBe(400);
  });
});
