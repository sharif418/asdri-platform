import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { installCookieMock, forgeCookie, newToken, tokenHash } from "../helpers/auth-forge";

/**
 * Round 11 — course preview links (GAPS E.26a / the last surviving round-7/8
 * loss). The preview infrastructure gains a "Course" entity:
 *
 *   1. The token side: signPreviewToken/verifyPreviewToken accept Course
 *      (and refuse it in the isPreviewEntity guard when crafted otherwise).
 *   2. The minting API: the module gate FOLLOWS the parsed entity —
 *      academics.manage for Course (so a pure-academics EDITOR can mint)
 *      while Notice/Post keep content.manage (ADMISSIONS → 403 there too).
 *   3. The loaders: getCourseForPreview returns the DRAFT row through the
 *      same view-model as the public page; getCourseBySlug keeps null-ing
 *      unpublished slugs (the permalink 404 stays).
 *
 * Self-contained fixtures (the test DB is migrated but NOT seeded): one
 * draft course with a semester + subject, forged sessions per role like
 * content-revisions.test.ts.
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d5e5f5a5a5a1";

const setCookie = installCookieMock();
// Route handlers imported AFTER the cookie mock is installed.
const { POST: POST_PREVIEW_LINK } = await import("@/app/api/admin/preview-link/route");
const { signPreviewToken, verifyPreviewToken } = await import("@/lib/preview-link");
const { getCourseForPreview, getCourseBySlug } = await import("@/lib/content/courses");

const CSRF = "csrf-course-preview-1";
const stamp = Date.now();

interface StaffSession {
  userId: string;
  sessionId: string;
  token: string;
}

async function createStaffSession(role: "EDITOR" | "ADMISSIONS", label: string): Promise<StaffSession> {
  const email = `${label}-${stamp}-${Math.floor(Math.random() * 1000)}@test.local`;
  const user = await db.user.create({
    data: { email, name: `কোর্স প্রিভিউ পরীক্ষা ${label}`, role, passwordHash: hashPassword("password-12345") },
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

function actAs(staff: StaffSession | undefined): void {
  setCookie(staff ? forgeCookie(staff.sessionId, staff.token) : undefined);
}

function jsonRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json", "x-csrf-token": CSRF },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

let editor: StaffSession;
let admissions: StaffSession;
let draftCourseId = "";
const DRAFT_SLUG = `preview-draft-course-${stamp}`;
const SLUG_PUBLISHED_PROBE = `preview-published-course-${stamp}`;
const fixtureUserIds: string[] = [];
const fixtureCourseIds: string[] = [];

beforeAll(async () => {
  editor = await createStaffSession("EDITOR", "editor");
  admissions = await createStaffSession("ADMISSIONS", "admissions");
  fixtureUserIds.push(editor.userId, admissions.userId);

  // A DRAFT course (isPublished: false) with one semester + subject so the
  // COURSE_INCLUDE path (semesters → subjects ordering) is exercised too.
  const draft = await db.course.create({
    data: {
      code: `PC${stamp % 1000}`,
      slug: DRAFT_SLUG,
      titleBn: "অপ্রকাশিত ড্রাফট কোর্স",
      titleEn: "Unpublished draft course",
      taglineBn: "ড্রাফট ট্যাগলাইন",
      taglineEn: "Draft tagline",
      isPublished: false,
      semesters: {
        create: [
          {
            number: 1,
            year: 1,
            titleBn: "প্রথম সেমিস্টার",
            titleEn: "First semester",
            durationBn: "৬ মাস",
            durationEn: "6 months",
            subjects: {
              create: [
                { code: "PC101", titleBn: "আকীদা মূলায়ন", titleEn: "Aqidah foundations", credits: 3, marks: 100 },
              ],
            },
          },
        ],
      },
    },
  });
  draftCourseId = draft.id;
  fixtureCourseIds.push(draft.id);
});

afterAll(async () => {
  await db.course.deleteMany({ where: { id: { in: fixtureCourseIds } } });
  await db.session.deleteMany({ where: { id: { in: [editor.sessionId, admissions.sessionId] } } });
  await db.user.deleteMany({ where: { id: { in: fixtureUserIds } } });
});

describe("preview tokens accept the Course entity", () => {
  test("roundtrip: a Course token verifies with entity and entityId", () => {
    const payload = verifyPreviewToken(signPreviewToken("Course", draftCourseId));
    expect(payload).not.toBeNull();
    expect(payload!.entity).toBe("Course");
    expect(payload!.entityId).toBe(draftCourseId);
  });
});

describe("POST /api/admin/preview-link (Course)", () => {
  test("academics-capable EDITOR mints a signed URL that verifies back to the row", async () => {
    actAs(editor);
    const res = await POST_PREVIEW_LINK(
      jsonRequest("http://local/api/admin/preview-link", "POST", { entity: "Course", entityId: draftCourseId }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; data: { url: string; expiresAt: string } };
    expect(json.ok).toBe(true);
    expect(json.data.url.startsWith("/preview/")).toBe(true);
    expect(json.data.expiresAt).toBeTruthy();

    const payload = verifyPreviewToken(json.data.url.slice("/preview/".length));
    expect(payload?.entity).toBe("Course");
    expect(payload?.entityId).toBe(draftCourseId);
  });

  test("missing course row → 404", async () => {
    actAs(editor);
    const res = await POST_PREVIEW_LINK(
      jsonRequest("http://local/api/admin/preview-link", "POST", { entity: "Course", entityId: "no-such-course" }),
    );
    expect(res.status).toBe(404);
  });

  test("ADMISSIONS (no academics.manage) → 403; anonymous → 401", async () => {
    actAs(admissions);
    const forbidden = await POST_PREVIEW_LINK(
      jsonRequest("http://local/api/admin/preview-link", "POST", { entity: "Course", entityId: draftCourseId }),
    );
    expect(forbidden.status).toBe(403);

    actAs(undefined);
    const anon = await POST_PREVIEW_LINK(
      jsonRequest("http://local/api/admin/preview-link", "POST", { entity: "Course", entityId: draftCourseId }),
    );
    expect(anon.status).toBe(401);
  });

  test("the module gate still follows Notice → content (ADMISSIONS may NOT mint notices either)", async () => {
    // ADMISSIONS has neither content.manage nor academics-only paths to
    // Notice rows — the entity-following gate keeps the two worlds apart.
    actAs(admissions);
    const res = await POST_PREVIEW_LINK(
      jsonRequest("http://local/api/admin/preview-link", "POST", { entity: "Notice", entityId: "whatever" }),
    );
    expect(res.status).toBe(403);
  });
});

describe("draft course loaders", () => {
  test("getCourseForPreview returns the draft view-model; getCourseBySlug keeps it hidden", async () => {
    const preview = await getCourseForPreview(draftCourseId);
    expect(preview).not.toBeNull();
    expect(preview!.titleBn).toBe("অপ্রকাশিত ড্রাফট কোর্স");
    // The rich include path renders semesters/subjects into the curriculum.
    expect(preview!.details.curriculum.length).toBe(1);
    expect(preview!.details.curriculum[0]!.courses[0]!.code).toBe("PC101");

    // The public permalink data source stays null — the page 404s.
    expect(await getCourseBySlug(DRAFT_SLUG)).toBeNull();
    // And a slug that never existed never resolves either.
    expect(await getCourseBySlug(SLUG_PUBLISHED_PROBE)).toBeNull();
  });
});
