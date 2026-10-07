import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { installCookieMock, forgeCookie, newToken, tokenHash } from "../helpers/auth-forge";

/**
 * Round 4, workstream 4 — the library admin proofs the brief names:
 *
 *   1. a LIBRARIAN can create and update catalogue items (the module is theirs)
 *   2. an EDITOR is refused everywhere (403 — library.manage is not theirs)
 *   3. item + creators persist with their per-item roles
 *   4. a same-title second create gets the automatic -2 slug suffix
 *   5. a category with items attached refuses to delete (the guard)
 *   6. the checkout flow: record → open → mark returned
 *   7. visibility defaults to PUBLIC
 *
 * Self-contained fixtures (the test DB is migrated but NOT seeded): category
 * and item rows are created through the real API handlers, sessions forged
 * through the same helpers portals-access.test.ts uses.
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

const setCookie = installCookieMock();
// Route handlers imported AFTER the cookie mock is installed.
const { GET: LIST_ITEMS, POST: CREATE_ITEM } = await import("@/app/api/admin/library/route");
const { PATCH: UPDATE_ITEM, DELETE: DELETE_ITEM } = await import("@/app/api/admin/library/[id]/route");
const { POST: CREATE_CATEGORY } = await import("@/app/api/admin/library/categories/route");
const { DELETE: DELETE_CATEGORY } = await import("@/app/api/admin/library/categories/[id]/route");
const { GET: LIST_CHECKOUTS, POST: CREATE_CHECKOUT } = await import("@/app/api/admin/library/checkouts/route");
const { PATCH: UPDATE_CHECKOUT } = await import("@/app/api/admin/library/checkouts/[id]/route");

const CSRF = "csrf-lib-test-1";

function jsonRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json", "x-csrf-token": CSRF },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

interface StaffSession {
  userId: string;
  email: string;
  sessionId: string;
  token: string;
}

async function createStaffSession(role: "LIBRARIAN" | "EDITOR", label: string): Promise<StaffSession> {
  const email = `${label}-${Date.now()}-${Math.floor(Math.random() * 1000)}@test.local`;
  const user = await db.user.create({
    data: { email, name: `লাইব্রেরি পরীক্ষা ${label}`, role, passwordHash: hashPassword("password-12345") },
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
  return { userId: user.id, email, sessionId: session.id, token };
}

/** Point the forged cookie jar at the given staff session. */
function actAs(staff: StaffSession): void {
  setCookie(forgeCookie(staff.sessionId, staff.token));
}

let librarian: StaffSession;
let editor: StaffSession;

beforeAll(async () => {
  librarian = await createStaffSession("LIBRARIAN", "librarian");
  editor = await createStaffSession("EDITOR", "editor");
});

afterAll(async () => {
  await db.session.deleteMany({ where: { userId: { in: [librarian.userId, editor.userId] } } });
  await db.user.deleteMany({ where: { id: { in: [librarian.userId, editor.userId] } } });
});

/** Create a category through the API as the librarian; returns its id. */
async function apiCategory(nameBn: string, nameEn: string): Promise<string> {
  actAs(librarian);
  const res = await CREATE_CATEGORY(jsonRequest("http://local/api/admin/library/categories", "POST", { nameBn, nameEn }));
  expect(res.status).toBe(201);
  const json = (await res.json()) as { ok: boolean; data: { id: string } };
  expect(json.ok).toBe(true);
  return json.data.id;
}

/** Create a minimal BOOK item through the API as the librarian. */
async function apiItem(payload: Record<string, unknown>): Promise<{ id: string; slug: string }> {
  actAs(librarian);
  const res = await CREATE_ITEM(jsonRequest("http://local/api/admin/library", "POST", { type: "BOOK", titleBn: "পরীক্ষা বই", ...payload }));
  const json = (await res.json()) as { ok: boolean; data?: { id: string; slug: string }; error?: string };
  if (!res.ok || !json.ok || !json.data) throw new Error(`apiItem failed: ${res.status} ${json.error ?? ""}`);
  return json.data;
}

describe("library admin API", () => {
  test("LIBRARIAN creates an item — creators persist with per-item roles, visibility defaults PUBLIC", async () => {
    const categoryId = await apiCategory("পরীক্ষা ক্যাটাগরি আকীদা", "Test Category Aqidah");

    const created = await apiItem({
      titleBn: "আকীদার পরীক্ষা গ্রন্থ",
      titleEn: "Test Book Aqidah",
      categoryId,
      publisher: { nameBn: "পরীক্ষা প্রকাশনী", nameEn: "Test Press" },
      creators: [
        { nameBn: "লেখক এক", nameEn: "Author One", role: "AUTHOR" },
        { nameBn: "অনুবাদক দুই", nameEn: "Translator Two", role: "TRANSLATOR" },
      ],
      publishYear: 2025,
    });
    expect(created.slug).toBe("test-book-aqidah");

    const item = await db.libraryItem.findUnique({
      where: { id: created.id },
      include: { creators: { orderBy: { sortOrder: "asc" }, include: { creator: true } }, publisher: true, category: true },
    });
    expect(item).not.toBeNull();
    // visibility default PUBLIC — the brief's proof #7
    expect(item!.visibility).toBe("PUBLIC");
    expect(item!.isPublished).toBe(true);
    expect(item!.categoryId).toBe(categoryId);
    expect(item!.publisher?.nameBn).toBe("পরীক্ষা প্রকাশনী");
    // creators persisted with their roles, in order
    expect(item!.creators.map((link) => `${link.creator.nameEn}:${link.role}`)).toEqual(["Author One:AUTHOR", "Translator Two:TRANSLATOR"]);

    // the audit trail recorded the create
    const auditRow = await db.auditLog.findFirst({ where: { action: "library.item.create", entityId: created.id } });
    expect(auditRow?.actorId).toBe(librarian.userId);

    // LIBRARIAN update round-trip: publish flip + creator replacement
    actAs(librarian);
    const patched = await UPDATE_ITEM(jsonRequest(`http://local/api/admin/library/${created.id}`, "PATCH", {
      isPublished: false,
      titleEn: "Test Book Aqidah Revised",
      creators: [{ nameBn: "সম্পাদক তিন", nameEn: "Editor Three", role: "EDITOR" }],
    }), { params: Promise.resolve({ id: created.id }) });
    expect(patched.status).toBe(200);
    const updated = await db.libraryItem.findUnique({
      where: { id: created.id },
      include: { creators: { include: { creator: true } } },
    });
    expect(updated!.isPublished).toBe(false);
    expect(updated!.creators.map((link) => `${link.creator.nameEn}:${link.role}`)).toEqual(["Editor Three:EDITOR"]);
    // the slug stays stable across edits (public reader URLs must not move)
    expect(updated!.slug).toBe("test-book-aqidah");

    // GET list finds it back (session + role read guard)
    const listRes = await LIST_ITEMS(new NextRequest("http://local/api/admin/library?q=aqidah"));
    expect(listRes.status).toBe(200);
    const listJson = (await listRes.json()) as { ok: boolean; data: { items: { id: string }[] } };
    expect(listJson.ok).toBe(true);
    expect(listJson.data.items.some((row) => row.id === created.id)).toBe(true);

    await db.libraryItem.delete({ where: { id: created.id } });
    await db.libraryCategory.delete({ where: { id: categoryId } });
    await db.libraryCreator.deleteMany({ where: { nameBn: { in: ["লেখক এক", "অনুবাদক দুই", "সম্পাদক তিন"] } } });
    await db.libraryPublisher.deleteMany({ where: { nameBn: "পরীক্ষা প্রকাশনী" } });
  });

  test("EDITOR is refused on every library mutation (403 — library.manage)", async () => {
    actAs(editor);
    const itemRes = await CREATE_ITEM(jsonRequest("http://local/api/admin/library", "POST", { type: "BOOK", titleBn: "সম্পাদকের বই" }));
    expect(itemRes.status).toBe(403);
    const catRes = await CREATE_CATEGORY(jsonRequest("http://local/api/admin/library/categories", "POST", { nameBn: "সম্পাদক ক্যাটাগরি", nameEn: "Editor Cat" }));
    expect(catRes.status).toBe(403);
    const checkoutRes = await CREATE_CHECKOUT(jsonRequest("http://local/api/admin/library/checkouts", "POST", { itemId: "nope", borrowerName: "কেউ একজন" }));
    expect(checkoutRes.status).toBe(403);

    // a real item id for the [id] routes: even with one, the EDITOR never passes
    const victim = await db.libraryItem.create({ data: { slug: `editor-forbidden-${Date.now()}`, type: "BOOK", titleBn: "নিষিদ্ধ বই" } });
    const patchRes = await UPDATE_ITEM(jsonRequest(`http://local/api/admin/library/${victim.id}`, "PATCH", { titleBn: "বদলানো যাবে না" }), { params: Promise.resolve({ id: victim.id }) });
    expect(patchRes.status).toBe(403);
    const deleteRes = await DELETE_ITEM(new NextRequest(`http://local/api/admin/library/${victim.id}`, { method: "DELETE", headers: { "x-csrf-token": CSRF } }), { params: Promise.resolve({ id: victim.id }) });
    expect(deleteRes.status).toBe(403);

    // but the read guard also refuses the listing
    const listRes = await LIST_ITEMS(new NextRequest("http://local/api/admin/library"));
    expect(listRes.status).toBe(403);

    await db.libraryItem.delete({ where: { id: victim.id } });
  });

  test("a same-title second create earns the automatic -2 slug suffix", async () => {
    const first = await apiItem({ titleBn: "একই শিরোনামের বই এক", titleEn: "Same Title Book" });
    expect(first.slug).toBe("same-title-book");

    const second = await apiItem({ titleBn: "একই শিরোনামের বই দুই", titleEn: "Same Title Book" });
    expect(second.slug).toBe("same-title-book-2");

    // both rows exist side by side
    const rows = await db.libraryItem.findMany({ where: { slug: { in: [first.slug, second.slug] } } });
    expect(rows.length).toBe(2);

    await db.libraryItem.deleteMany({ where: { id: { in: [first.id, second.id] } } });
  });

  test("a category with items attached refuses to delete; empty one deletes", async () => {
    const categoryId = await apiCategory("সুরক্ষিত ক্যাটাগরি", "Guarded Category");
    const item = await apiItem({ titleBn: "সুরক্ষিত ক্যাটাগরির বই", titleEn: "Guarded Category Book", categoryId });

    actAs(librarian);
    const refused = await DELETE_CATEGORY(new NextRequest(`http://local/api/admin/library/categories/${categoryId}`, { method: "DELETE", headers: { "x-csrf-token": CSRF } }), { params: Promise.resolve({ id: categoryId }) });
    expect(refused.status).toBe(409);
    const refusedJson = (await refused.json()) as { ok: boolean; error?: string };
    expect(refusedJson.ok).toBe(false);
    expect(refusedJson.error).toContain("আইটেম");

    // detach the item, then the delete goes through
    const cleared = await UPDATE_ITEM(jsonRequest(`http://local/api/admin/library/${item.id}`, "PATCH", { categoryId: null }), { params: Promise.resolve({ id: item.id }) });
    expect(cleared.status).toBe(200);
    const deleted = await DELETE_CATEGORY(new NextRequest(`http://local/api/admin/library/categories/${categoryId}`, { method: "DELETE", headers: { "x-csrf-token": CSRF } }), { params: Promise.resolve({ id: categoryId }) });
    expect(deleted.status).toBe(200);

    await db.libraryItem.delete({ where: { id: item.id } });
  });

  test("checkout flow: record → open → returned", async () => {
    const item = await apiItem({ titleBn: "ধারযোগ্য বই", titleEn: "Checkoutable Book" });

    actAs(librarian);
    const created = await CREATE_CHECKOUT(
      jsonRequest("http://local/api/admin/library/checkouts", "POST", {
        itemId: item.id,
        borrowerName: "মুহাম্মদ পরীক্ষা",
        borrowerPhone: "01700000099",
        dueAt: "2026-12-31",
        note: "পরীক্ষা ধার",
      }),
    );
    expect(created.status).toBe(201);
    const createdJson = (await created.json()) as { ok: boolean; data: { id: string } };
    expect(createdJson.ok).toBe(true);

    let checkout = await db.libraryCheckout.findUnique({ where: { id: createdJson.data.id } });
    expect(checkout).not.toBeNull();
    expect(checkout!.returnedAt).toBeNull();
    expect(checkout!.borrowerName).toBe("মুহাম্মদ পরীক্ষা");
    expect(checkout!.dueAt?.getUTCFullYear()).toBe(2026);

    // the open tab shows it; the returned tab does not
    const openList = (await (await LIST_CHECKOUTS(new NextRequest("http://local/api/admin/library/checkouts?status=open"))).json()) as {
      ok: boolean;
      data: { items: { id: string; returnedAt: string | null }[] };
    };
    expect(openList.ok).toBe(true);
    const openRow = openList.data.items.find((row) => row.id === createdJson.data.id);
    expect(openRow).toBeDefined();
    expect(openRow!.returnedAt).toBeNull();

    // mark returned
    const returned = await UPDATE_CHECKOUT(jsonRequest(`http://local/api/admin/library/checkouts/${createdJson.data.id}`, "PATCH", { returned: true }), { params: Promise.resolve({ id: createdJson.data.id }) });
    expect(returned.status).toBe(200);
    checkout = await db.libraryCheckout.findUnique({ where: { id: createdJson.data.id } });
    expect(checkout!.returnedAt).not.toBeNull();

    // now the returned tab has it and the open tab does not
    const returnedList = (await (await LIST_CHECKOUTS(new NextRequest("http://local/api/admin/library/checkouts?status=returned"))).json()) as {
      ok: boolean;
      data: { items: { id: string }[] };
    };
    expect(returnedList.data.items.some((row) => row.id === createdJson.data.id)).toBe(true);

    await db.libraryCheckout.delete({ where: { id: createdJson.data.id } });
    await db.libraryItem.delete({ where: { id: item.id } });
  });
});
