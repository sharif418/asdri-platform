import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { installCookieMock, forgeCookie, newToken, tokenHash } from "../helpers/auth-forge";

/**
 * Round-9 — the alumni registry proofs (restored round-6 module):
 *
 *   1. an ADMISSIONS officer can create registry rows; the registry number
 *      is minted by the API (AL-YYYY-NNNN), never by the form
 *   2. an EDITOR is refused everywhere (403 — alumni.manage is not theirs)
 *   3. office PATCH updates persist
 *   4. DELETE is guarded: a linked row refuses (409); unlinked deletes
 *   5. the alumnus's own self-update claims an office row by email
 *      (userId pins on first save) and then edits the linked row
 *   6. a non-ALUMNI account is refused on the portal route (403)
 *   7. the public directory is privacy-safe: published rows only, and the
 *      result carries no contact fields at all
 *
 * Self-contained fixtures (the test DB is migrated but NOT seeded).
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

const setCookie = installCookieMock();
// Route handlers imported AFTER the cookie mock is installed.
const { GET: LIST_PROFILES, POST: CREATE_PROFILE } = await import("@/app/api/admin/alumni/route");
const { PATCH: UPDATE_PROFILE, DELETE: DELETE_PROFILE } = await import("@/app/api/admin/alumni/[id]/route");
const { POST: SELF_UPDATE } = await import("@/app/api/portal/alumni/profile/route");
const { getAlumniDirectory } = await import("@/lib/alumni");

const CSRF = "csrf-alumni-test-1";

function jsonRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json", "x-csrf-token": CSRF },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

interface Actor {
  userId: string;
  email: string;
  sessionId: string;
  token: string;
}

async function createActor(role: "ADMISSIONS" | "EDITOR" | "ALUMNI" | "GUARDIAN", label: string): Promise<Actor> {
  const email = `${label}-${Date.now()}-${Math.floor(Math.random() * 1000)}@test.local`;
  const user = await db.user.create({
    data: { email, name: `অ্যালামনাই পরীক্ষা ${label}`, role, passwordHash: hashPassword("password-12345") },
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

function actAs(actor: Actor): void {
  setCookie(forgeCookie(actor.sessionId, actor.token));
}

let admissions: Actor;
let editor: Actor;
let alumnus: Actor;
let guardian: Actor;

beforeAll(async () => {
  admissions = await createActor("ADMISSIONS", "admissions");
  editor = await createActor("EDITOR", "editor");
  alumnus = await createActor("ALUMNI", "alumnus");
  guardian = await createActor("GUARDIAN", "guardian");
});

afterAll(async () => {
  const ids = [admissions.userId, editor.userId, alumnus.userId, guardian.userId];
  await db.alumniProfile.deleteMany({ where: { OR: [{ userId: { in: ids } }, { email: { in: [alumnus.email, guardian.email] } }] } });
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
});

function createPayload(overrides: Record<string, unknown> = {}) {
  return {
    nameBn: "পরীক্ষা প্রাক্তন",
    nameEn: "Test Graduate",
    courseKey: "PGDID",
    batchYear: 2025,
    batchNoBn: "১ম ব্যাচ",
    occupationBn: "শিক্ষক",
    districtBn: "ঢাকা",
    phone: "01700000001",
    email: "",
    isPublished: true,
    ...overrides,
  };
}

describe("alumni registry (admin)", () => {
  test("ADMISSIONS creates a row; the registry number is office-minted", async () => {
    actAs(admissions);
    const res = await CREATE_PROFILE(
      jsonRequest("http://local/api/admin/alumni", "POST", createPayload({ nameBn: "প্রথম প্রাক্তন" })),
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as { ok: boolean; data: { registryNo: string } };
    expect(json.ok).toBe(true);
    expect(json.data.registryNo).toMatch(/^AL-\d{4}-\d{4}$/);
  });

  test("EDITOR is refused (alumni.manage is not theirs)", async () => {
    actAs(editor);
    const res = await CREATE_PROFILE(jsonRequest("http://local/api/admin/alumni", "POST", createPayload()));
    expect(res.status).toBe(403);
  });

  test("an anonymous GET is refused; the officer's list is safe-read", async () => {
    setCookie("");
    const res = await LIST_PROFILES(new NextRequest("http://local/api/admin/alumni"));
    expect(res.status).toBe(401);

    actAs(admissions);
    const ok = await LIST_PROFILES(new NextRequest("http://local/api/admin/alumni"));
    expect(ok.status).toBe(200);
    const json = (await ok.json()) as { ok: boolean; data: { total: number } };
    expect(json.ok).toBe(true);
    expect(json.data.total).toBeGreaterThanOrEqual(1);
  });

  test("PATCH persists office edits", async () => {
    actAs(admissions);
    const created = await CREATE_PROFILE(
      jsonRequest("http://local/api/admin/alumni", "POST", createPayload({ nameBn: "সম্পাদনাযোগ্য প্রাক্তন" })),
    );
    const { data } = (await created.json()) as { data: { id: string } };

    const res = await UPDATE_PROFILE(
      jsonRequest(`http://local/api/admin/alumni/${data.id}`, "PATCH", { occupationBn: "ইমাম", isPublished: false }),
      { params: Promise.resolve({ id: data.id }) },
    );
    expect(res.status).toBe(200);
    const row = await db.alumniProfile.findUnique({ where: { id: data.id } });
    expect(row?.occupationBn).toBe("ইমাম");
    expect(row?.isPublished).toBe(false);
  });

  test("DELETE refuses a linked row (409) and removes an unlinked one", async () => {
    actAs(admissions);
    const linked = await CREATE_PROFILE(
      jsonRequest("http://local/api/admin/alumni", "POST", createPayload({ nameBn: "যুক্ত প্রাক্তন", email: alumnus.email })),
    );
    const linkedId = ((await linked.json()) as { data: { id: string } }).data.id;
    // claim it as the alumnus first (pins userId)
    actAs(alumnus);
    await SELF_UPDATE(jsonRequest("http://local/api/portal/alumni/profile", "POST", { phone: "01700000002" }));

    actAs(admissions);
    const refuse = await DELETE_PROFILE(new NextRequest(`http://local/api/admin/alumni/${linkedId}`, { method: "DELETE", headers: { "x-csrf-token": CSRF } }), { params: Promise.resolve({ id: linkedId }) });
    expect(refuse.status).toBe(409);

    const unlinked = await CREATE_PROFILE(
      jsonRequest("http://local/api/admin/alumni", "POST", createPayload({ nameBn: "অযুক্ত প্রাক্তন" })),
    );
    const unlinkedId = ((await unlinked.json()) as { data: { id: string } }).data.id;
    const ok = await DELETE_PROFILE(new NextRequest(`http://local/api/admin/alumni/${unlinkedId}`, { method: "DELETE", headers: { "x-csrf-token": CSRF } }), { params: Promise.resolve({ id: unlinkedId }) });
    expect(ok.status).toBe(200);
    expect(await db.alumniProfile.findUnique({ where: { id: unlinkedId } })).toBeNull();
  });
});

describe("alumni portal self-service", () => {
  test("a GUARDIAN is refused (role gate)", async () => {
    actAs(guardian);
    const res = await SELF_UPDATE(jsonRequest("http://local/api/portal/alumni/profile", "POST", { phone: "01700000003" }));
    expect(res.status).toBe(403);
  });

  test("the alumnus's update edits the claimed row (claimed in the DELETE test)", async () => {
    actAs(alumnus);
    const res = await SELF_UPDATE(
      jsonRequest("http://local/api/portal/alumni/profile", "POST", {
        occupationBn: "গবেষক",
        organizationBn: "পরীক্ষা প্রতিষ্ঠান",
        districtBn: "রংপুর",
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; data: { claimed: boolean } };
    expect(json.ok).toBe(true);
    expect(json.data.claimed).toBe(false); // already claimed moments ago

    const row = await db.alumniProfile.findUnique({ where: { userId: alumnus.userId } });
    expect(row?.occupationBn).toBe("গবেষক");
    expect(row?.organizationBn).toBe("পরীক্ষা প্রতিষ্ঠান");
    expect(row?.districtBn).toBe("রংপুর");
  });

  test("invalid payloads are field-rejected", async () => {
    actAs(alumnus);
    const res = await SELF_UPDATE(
      jsonRequest("http://local/api/portal/alumni/profile", "POST", { email: "not-an-email" }),
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { fields: Record<string, string> };
    expect(json.fields.email).toBeTruthy();
  });
});

describe("public alumni directory (privacy)", () => {
  test("published rows only; no contact fields anywhere in the result", async () => {
    const result = await getAlumniDirectory({});
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.rows.every((row) => !("phone" in row) && !("email" in row) && !("addressBn" in row))).toBe(true);

    // unpublished rows never leak
    await db.alumniProfile.updateMany({ where: { userId: alumnus.userId }, data: { isPublished: false } });
    const filtered = await getAlumniDirectory({ q: "গবেষক" });
    expect(filtered.rows.every((row) => row.occupationBn !== "গবেষক" || row.registryNo === "")).toBe(true);
  });

  test("course filter narrows the facets' territory", async () => {
    const all = await getAlumniDirectory({});
    if (all.facets.length > 0) {
      const key = all.facets[0].courseKey;
      const narrowed = await getAlumniDirectory({ course: key });
      expect(narrowed.rows.every((row) => row.courseKey === key)).toBe(true);
    }
  });
});
