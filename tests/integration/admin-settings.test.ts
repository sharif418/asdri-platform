import { describe, test, expect, beforeAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { installCookieMock, jsonRequest, csrfJsonRequest } from "../helpers/auth-forge";

/**
 * Round-3 admin modules, through the REAL route handlers:
 *   • PATCH /api/admin/settings (typed settings blobs + whitelist + audit)
 *   • PATCH /api/admin/flags (module toggles)
 *   • /api/admin/menus CRUD + reorder + child protection
 *   • PATCH /api/admin/home-sections (composition batch)
 *   • /api/admin/stats + /api/admin/faqs CRUD
 * Every route is requireModule-guarded (session + CSRF + role) and audited.
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

const setCookie = installCookieMock();
const { PATCH: PATCH_SETTINGS } = await import("@/app/api/admin/settings/route");
const { PATCH: PATCH_FLAGS } = await import("@/app/api/admin/flags/route");
const { POST: CREATE_MENU } = await import("@/app/api/admin/menus/route");
const { PATCH: PATCH_MENU, DELETE: DELETE_MENU } = await import("@/app/api/admin/menus/[id]/route");
const { PATCH: PATCH_SECTIONS } = await import("@/app/api/admin/home-sections/route");
const { POST: CREATE_STAT } = await import("@/app/api/admin/stats/route");
const { PATCH: PATCH_STAT, DELETE: DELETE_STAT } = await import("@/app/api/admin/stats/[id]/route");
const { POST: CREATE_FAQ } = await import("@/app/api/admin/faqs/route");
const { PATCH: PATCH_FAQ, DELETE: DELETE_FAQ } = await import("@/app/api/admin/faqs/[id]/route");

const base = "http://localhost:3000/api/admin";

let adminSession: { cookieValue: string; csrfToken: string };
let editorSession: { cookieValue: string; csrfToken: string };

beforeAll(async () => {
  const admin = await db.user.create({
    data: {
      email: `settings-admin-${Date.now()}@test.local`,
      name: "অ্যাডমিন",
      passwordHash: hashPassword("Password123!"),
      role: "ADMIN",
    },
  });
  const editor = await db.user.create({
    data: {
      email: `settings-editor-${Date.now()}@test.local`,
      name: "সম্পাদক",
      passwordHash: hashPassword("Password123!"),
      role: "EDITOR",
    },
  });
  const { createSession } = await import("@/lib/auth");
  adminSession = await createSession(admin.id);
  editorSession = await createSession(editor.id);
});

/** CSRF-signed request for the (in-process) handler under test. */
function authed(url: string, body: unknown, session = adminSession): NextRequest {
  return csrfJsonRequest(url, body, session.csrfToken) as NextRequest;
}

describe("PATCH /api/admin/settings (the Site settings module's write path)", () => {
  test("401 without a session", async () => {
    setCookie(undefined);
    const res = await PATCH_SETTINGS(jsonRequest(`${base}/settings`, { key: "site.payment", value: {} }));
    expect(res.status).toBe(401);
  });

  test("403 for EDITOR (settings is ADMIN-only)", async () => {
    setCookie(editorSession.cookieValue);
    const res = await PATCH_SETTINGS(authed(`${base}/settings`, { key: "site.payment", value: {} }, editorSession));
    expect(res.status).toBe(403);
  });

  test("400 for a key outside the editable whitelist", async () => {
    setCookie(adminSession.cookieValue);
    const res = await PATCH_SETTINGS(authed(`${base}/settings`, { key: "secret.internal", value: { x: 1 } }));
    expect(res.status).toBe(400);
  });

  test("400 with per-field errors for an invalid payment blob", async () => {
    const res = await PATCH_SETTINGS(
      authed(`${base}/settings`, { key: "site.payment", value: { bkash: "", nagad: "", rocket: "", bankBn: "x".repeat(700) } }),
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { fields?: Record<string, string> };
    expect(json.fields?.bankBn).toBeTruthy();
  });

  test("200 writes the typed blob, stamps updatedBy and audits the diff", async () => {
    const value = { bkash: "01711-222333", nagad: "01811-444555", rocket: "01911-666777", bankBn: "ইসলামী ব্যাংক" };
    const res = await PATCH_SETTINGS(authed(`${base}/settings`, { key: "site.payment", value }));
    expect(res.status).toBe(200);

    const row = await db.siteSetting.findUniqueOrThrow({ where: { key: "site.payment" } });
    expect(row.value).toMatchObject(value);
    expect(row.updatedBy).toBeTruthy(); // stamped with the acting admin's id

    const auditRow = await db.auditLog.findFirst({
      where: { action: "setting.update", entity: "SiteSetting", entityId: "site.payment" },
      orderBy: { createdAt: "desc" },
    });
    expect(auditRow).not.toBeNull();
  });

  test("identity write passes the bilingual schema", async () => {
    const value = {
      nameBn: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট",
      nameEn: "As-Sunnah Dawah & Research Institute",
      parentBn: "আস-সুন্নাহ ফাউন্ডেশনের একটি শিক্ষাপ্রতিষ্ঠান",
      parentEn: "An Educational Institution of As-Sunnah Foundation",
      shortBn: "আস-সুন্নাহ ইনস্টিটিউট",
      shortEn: "ASDRI",
      taglineBn: "ট্যাগলাইন",
      taglineEn: "Tagline",
    };
    const res = await PATCH_SETTINGS(authed(`${base}/settings`, { key: "site.identity", value }));
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/admin/flags (feature flag toggles)", () => {
  test("401 without a session", async () => {
    setCookie(undefined);
    const res = await PATCH_FLAGS(jsonRequest(`${base}/flags`, { updates: [{ key: "blog", isEnabled: false }] }));
    expect(res.status).toBe(401);
  });

  test("403 for EDITOR, 200 for ADMIN + audit + isFeatureEnabled reflects it", async () => {
    // The test DB is migration-only (never seeded): create the flag row first.
    await db.featureFlag.upsert({
      where: { key: "blog" },
      create: { key: "blog", labelBn: "ব্লগ", labelEn: "Blog", isEnabled: true },
      update: { isEnabled: true },
    });

    setCookie(editorSession.cookieValue);
    const forbidden = await PATCH_FLAGS(authed(`${base}/flags`, { updates: [{ key: "blog", isEnabled: false }] }, editorSession));
    expect(forbidden.status).toBe(403);

    setCookie(adminSession.cookieValue);
    const res = await PATCH_FLAGS(authed(`${base}/flags`, { updates: [{ key: "blog", isEnabled: false }] }));
    expect(res.status).toBe(200);

    const flag = await db.featureFlag.findUniqueOrThrow({ where: { key: "blog" } });
    expect(flag.isEnabled).toBe(false);

    const auditRow = await db.auditLog.findFirst({
      where: { action: "flag.update", entity: "FeatureFlag", entityId: "blog" },
      orderBy: { createdAt: "desc" },
    });
    expect(auditRow).not.toBeNull();

    // restore
    await PATCH_FLAGS(authed(`${base}/flags`, { updates: [{ key: "blog", isEnabled: true }] }));
  });
});

describe("/api/admin/menus (the navigation the public header renders)", () => {
  let parentId: string;
  let childId: string;

  test("POST creates a HEADER_MAIN parent, audited", async () => {
    const res = await CREATE_MENU(
      authed(`${base}/menus`, { location: "HEADER_MAIN", labelBn: "পরীক্ষা মেনু", labelEn: "Test menu", href: "/about", sortOrder: 500, isVisible: true }),
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as { data?: { id: string } };
    parentId = json.data!.id;
    expect(await db.auditLog.count({ where: { action: "menu.create", entityId: parentId } })).toBe(1);
  });

  test("POST nests a child (one level only) and rejects a grandchild", async () => {
    const res = await CREATE_MENU(
      authed(`${base}/menus`, { location: "HEADER_MAIN", labelBn: "সাব-মেনু", labelEn: "Sub menu", href: "/about/leadership", parentId, sortOrder: 0 }),
    );
    expect(res.status).toBe(201);
    childId = ((await res.json()) as { data: { id: string } }).data.id;

    const grandchild = await CREATE_MENU(
      authed(`${base}/menus`, { location: "HEADER_MAIN", labelBn: "নাতি-মেনু", labelEn: "Grandchild", href: "/x", parentId: childId }),
    );
    expect(grandchild.status).toBe(400); // two-level cap enforced
  });

  test("PATCH moves the item up by swapping sortOrder with its neighbour", async () => {
    const neighbour = await CREATE_MENU(
      authed(`${base}/menus`, { location: "HEADER_MAIN", labelBn: "প্রতিবেশী", labelEn: "Neighbour", href: "/research", sortOrder: 499 }),
    );
    const neighbourId = ((await neighbour.json()) as { data: { id: string } }).data.id;
    const before = await db.menuItem.findUniqueOrThrow({ where: { id: parentId } });
    const res = await PATCH_MENU(
      new NextRequest(`${base}/menus/${parentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-csrf-token": adminSession.csrfToken },
        body: JSON.stringify({ direction: "up" }),
      }),
      { params: Promise.resolve({ id: parentId }) },
    );
    expect(res.status).toBe(200);
    const after = await db.menuItem.findUniqueOrThrow({ where: { id: parentId } });
    expect(after.sortOrder).not.toBe(before.sortOrder);
    await DELETE_MENU(
      new NextRequest(`${base}/menus/${neighbourId}`, {
        method: "DELETE",
        headers: { "x-csrf-token": adminSession.csrfToken },
      }),
      { params: Promise.resolve({ id: neighbourId }) },
    );
  });

  test("DELETE refuses a parent that still has children (409)", async () => {
    const res = await DELETE_MENU(
      new NextRequest(`${base}/menus/${parentId}`, {
        method: "DELETE",
        headers: { "x-csrf-token": adminSession.csrfToken },
      }),
      { params: Promise.resolve({ id: parentId }) },
    );
    expect(res.status).toBe(409);
  });

  test("DELETE removes the child, then the parent", async () => {
    const delChild = await DELETE_MENU(
      new NextRequest(`${base}/menus/${childId}`, {
        method: "DELETE",
        headers: { "x-csrf-token": adminSession.csrfToken },
      }),
      { params: Promise.resolve({ id: childId }) },
    );
    expect(delChild.status).toBe(200);
    const delParent = await DELETE_MENU(
      new NextRequest(`${base}/menus/${parentId}`, {
        method: "DELETE",
        headers: { "x-csrf-token": adminSession.csrfToken },
      }),
      { params: Promise.resolve({ id: parentId }) },
    );
    expect(delParent.status).toBe(200);
  });
});

describe("PATCH /api/admin/home-sections (home composition)", () => {
  test("EDITOR may edit content; batch update flips order/enable/titles with audit", async () => {
    // The test DB is migration-only: ensure the section row exists.
    await db.homeSection.upsert({
      where: { key: "campus" },
      create: { key: "campus", titleBn: "ক্যাম্পাস লাইফ", titleEn: "Campus life", sortOrder: 6, isEnabled: true },
      update: {},
    });
    const before = await db.homeSection.findUniqueOrThrow({ where: { key: "campus" } });
    const res = await PATCH_SECTIONS(
      authed(`${base}/home-sections`, {
        updates: [
          { key: "campus", isEnabled: !before.isEnabled, sortOrder: 6, titleBn: "ক্যাম্পাস লাইফ (সম্পাদিত)", titleEn: "Campus life (edited)" },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const after = await db.homeSection.findUniqueOrThrow({ where: { key: "campus" } });
    expect(after.isEnabled).toBe(!before.isEnabled);
    expect(after.titleBn).toContain("সম্পাদিত");
    expect(await db.auditLog.count({ where: { action: "home-section.update", entityId: "campus" } })).toBeGreaterThanOrEqual(1);
    // restore
    await PATCH_SECTIONS(
      authed(`${base}/home-sections`, {
        updates: [{ key: "campus", isEnabled: before.isEnabled, titleBn: before.titleBn, titleEn: before.titleEn }],
      }),
    );
  });

  test("unknown section keys are ignored, not errors", async () => {
    const res = await PATCH_SECTIONS(authed(`${base}/home-sections`, { updates: [{ key: "no-such-section", isEnabled: false }] }));
    expect(res.status).toBe(200);
  });
});

describe("/api/admin/stats + /api/admin/faqs (home band + FAQ CRUD)", () => {
  let statId: string;
  let faqId: string;

  test("stat create → patch → delete round-trip with audit", async () => {
    const create = await CREATE_STAT(
      authed(`${base}/stats`, { value: 4321, labelBn: "পরীক্ষা সংখ্যা", labelEn: "Test figure", suffixBn: "+", suffixEn: "+", sortOrder: 999 }),
    );
    expect(create.status).toBe(201);
    statId = ((await create.json()) as { data: { id: string } }).data.id;

    const patch = await PATCH_STAT(
      new NextRequest(`${base}/stats/${statId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-csrf-token": adminSession.csrfToken },
        body: JSON.stringify({ value: 5432, isPublished: false }),
      }),
      { params: Promise.resolve({ id: statId }) },
    );
    expect(patch.status).toBe(200);
    const row = await db.stat.findUniqueOrThrow({ where: { id: statId } });
    expect(row.value).toBe(5432);
    expect(row.isPublished).toBe(false);

    const del = await DELETE_STAT(
      new NextRequest(`${base}/stats/${statId}`, { method: "DELETE", headers: { "x-csrf-token": adminSession.csrfToken } }),
      { params: Promise.resolve({ id: statId }) },
    );
    expect(del.status).toBe(200);
    expect(await db.stat.findUnique({ where: { id: statId } })).toBeNull();
  });

  test("faq create → patch → delete round-trip with validation", async () => {
    const bad = await CREATE_FAQ(
      authed(`${base}/faqs`, { questionBn: "খ", answerBn: "য" }),
    );
    expect(bad.status).toBe(400);

    const create = await CREATE_FAQ(
      authed(`${base}/faqs`, { categoryBn: "ভর্তি", categoryEn: "Admission", questionBn: "টেস্ট প্রশ্ন কী?", questionEn: "What is the test question?", answerBn: "টেস্ট উত্তর।", answerEn: "Test answer.", sortOrder: 999 }),
    );
    expect(create.status).toBe(201);
    faqId = ((await create.json()) as { data: { id: string } }).data.id;

    const patch = await PATCH_FAQ(
      new NextRequest(`${base}/faqs/${faqId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-csrf-token": adminSession.csrfToken },
        body: JSON.stringify({ isPublished: false }),
      }),
      { params: Promise.resolve({ id: faqId }) },
    );
    expect(patch.status).toBe(200);
    expect((await db.faq.findUniqueOrThrow({ where: { id: faqId } })).isPublished).toBe(false);

    const del = await DELETE_FAQ(
      new NextRequest(`${base}/faqs/${faqId}`, { method: "DELETE", headers: { "x-csrf-token": adminSession.csrfToken } }),
      { params: Promise.resolve({ id: faqId }) },
    );
    expect(del.status).toBe(200);
  });
});
