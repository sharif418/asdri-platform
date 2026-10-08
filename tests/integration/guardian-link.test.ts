import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { installCookieMock, forgeCookie, newToken, tokenHash } from "../helpers/auth-forge";

/**
 * Round-10 — the guardian self-service child-link proofs (restores the lost
 * round-7 E.19 close):
 *
 *   1. happy path: correct tracking + family phone links the child
 *      (relation comes from the application's guardianRelation)
 *   2. anti-enumeration: unknown number, wrong phone, and a DRAFT all
 *      answer with ONE identical 404 — byte-identical bodies
 *   3. the family phone falls back to the applicant's own when the
 *      application carries no guardianPhone
 *   4. the 409 fires only after the factor passed (a different guardian)
 *   5. same guardian, same child → idempotent 200, no duplicate row
 *   6. role gate: an ALUMNI account is refused (403)
 *   7. CSRF is enforced (401 without the header)
 *   8. the rate limit trips (429) after the lookup-grade budget
 *
 * Self-contained fixtures (the test DB is migrated but NOT seeded).
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

const setCookie = installCookieMock();
const { POST: LINK } = await import("@/app/api/portal/guardian/link/route");

const CSRF = "csrf-guardian-link-1";

function jsonRequest(url: string, body?: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": CSRF, ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

interface Actor {
  userId: string;
  sessionId: string;
  token: string;
}

async function createActor(role: "GUARDIAN" | "ALUMNI", label: string): Promise<Actor> {
  const email = `${label}-${Date.now()}-${Math.floor(Math.random() * 1000)}@test.local`;
  const user = await db.user.create({
    data: { email, name: `সংযোগ পরীক্ষা ${label}`, role, passwordHash: hashPassword("password-12345") },
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

function actAs(actor: Actor): void {
  setCookie(forgeCookie(actor.sessionId, actor.token));
}

let alumni: Actor;
let intakeId: string;
let courseId: string;
const actorsToCleanup: Actor[] = [];

/** Fresh guardian actor — the lookup-grade rate budget is per account, so
 *  every test that spends requests gets its own (mirrors reality: each
 *  family has its own account and its own budget). */
async function newGuardian(label: string): Promise<Actor> {
  const actor = await createActor("GUARDIAN", label);
  actorsToCleanup.push(actor);
  return actor;
}

/** A submitted application with the given family phone fields. */
async function createApplication(opts: { guardianPhone?: string; phone: string; status?: string }): Promise<string> {
  const trackingNo = `ASDRI-2099-${Math.floor(100000 + Math.random() * 900000)}`;
  await db.application.create({
    data: {
      trackingNo,
      intakeId,
      fullNameBn: `পরীক্ষা সন্তান ${trackingNo.slice(-4)}`,
      fullNameEn: "Test Child",
      fatherName: "পরীক্ষা পিতা",
      motherName: "পরীক্ষা মাতা",
      phone: opts.phone,
      guardianName: "পরীক্ষা অভিভাবক",
      guardianPhone: opts.guardianPhone ?? "",
      guardianRelation: "পিতা",
      declarationAccepted: true,
      status: (opts.status as "SUBMITTED") ?? "SUBMITTED",
    },
  });
  return trackingNo;
}

beforeAll(async () => {
  alumni = await createActor("ALUMNI", "alumni");
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const course = await db.course.create({
    data: {
      code: `GL${suffix.slice(-4)}`,
      slug: `gl-test-course-${suffix}`,
      titleBn: "সংযোগ পরীক্ষা কোর্স",
      titleEn: "GL Test Course",
      durationBn: "১ বছর",
      durationEn: "1 year",
    },
  });
  courseId = course.id;
  const intake = await db.intake.create({
    data: { courseId: course.id, year: 2099, status: "OPEN", isPublished: true, seatsTotal: 40 },
  });
  intakeId = intake.id;
});

afterAll(async () => {
  const ids = [...actorsToCleanup.map((a) => a.userId), alumni.userId];
  const apps = await db.application.findMany({
    where: { trackingNo: { startsWith: "ASDRI-2099-" } },
    select: { id: true },
  });
  await db.guardianLink.deleteMany({ where: { guardianUserId: { in: ids } } });
  await db.application.deleteMany({ where: { id: { in: apps.map((a) => a.id) } } });
  await db.intake.deleteMany({ where: { courseId } });
  await db.course.deleteMany({ where: { id: courseId } });
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
});

describe("guardian self-service child-link", () => {
  test("happy path: tracking + family phone links the child with the application's relation", async () => {
    const guardian = await newGuardian("happy");
    const trackingNo = await createApplication({ guardianPhone: "01711000111", phone: "01711000222" });
    actAs(guardian);
    const res = await LINK(jsonRequest("http://local/api/portal/guardian/link", { trackingNo, phone: "01711000111" }));
    expect(res.status).toBe(201);
    const json = (await res.json()) as { ok: boolean; data: { relation: string; studentNameBn: string } };
    expect(json.ok).toBe(true);
    expect(json.data.relation).toBe("পিতা");

    const link = await db.guardianLink.findFirst({ where: { guardianUserId: guardian.userId } });
    expect(link?.relation).toBe("পিতা");

    // cleanup this fixture link so later tests start clean
    if (link) await db.guardianLink.delete({ where: { id: link.id } });
  });

  test("anti-enumeration: unknown number, wrong phone, and a DRAFT are ONE identical 404", async () => {
    const trackingNo = await createApplication({ guardianPhone: "01711000333", phone: "01711000444" });
    const draftNo = await createApplication({ guardianPhone: "01711000555", phone: "01711000666", status: "DRAFT" });

    const guardian = await newGuardian("enum");
    actAs(guardian);
    const unknown = await LINK(jsonRequest("http://local/api/portal/guardian/link", { trackingNo: "ASDRI-2099-000001", phone: "01711000333" }));
    const wrongPhone = await LINK(jsonRequest("http://local/api/portal/guardian/link", { trackingNo, phone: "01888000000" }));
    const draft = await LINK(jsonRequest("http://local/api/portal/guardian/link", { trackingNo: draftNo, phone: "01711000555" }));

    expect(unknown.status).toBe(404);
    expect(wrongPhone.status).toBe(404);
    expect(draft.status).toBe(404);
    const [u, w, d] = await Promise.all([unknown.json(), wrongPhone.json(), draft.json()]);
    expect(JSON.stringify(u)).toBe(JSON.stringify(w));
    expect(JSON.stringify(w)).toBe(JSON.stringify(d));
  });

  test("the family phone falls back to the applicant's own when guardianPhone is empty", async () => {
    const guardian = await newGuardian("fallback");
    const trackingNo = await createApplication({ guardianPhone: "", phone: "01711000777" });
    actAs(guardian);
    const res = await LINK(jsonRequest("http://local/api/portal/guardian/link", { trackingNo, phone: "01711000777" }));
    expect(res.status).toBe(201);
    const link = await db.guardianLink.findFirst({ where: { guardianUserId: guardian.userId } });
    expect(link).toBeTruthy();
    if (link) await db.guardianLink.delete({ where: { id: link.id } });
  });

  test("the 409 fires only after the factor passed (a different guardian)", async () => {
    const otherGuardian = await newGuardian("conflict-owner");
    const guardian = await newGuardian("conflict-prober");
    const trackingNo = await createApplication({ guardianPhone: "01711000888", phone: "01711000999" });
    const prober = await newGuardian("rate-prober");
    actAs(prober);
    const created = await LINK(jsonRequest("http://local/api/portal/guardian/link", { trackingNo, phone: "01711000888" }));
    expect(created.status).toBe(201);

    // a different guardian CANNOT probe the link without the family phone…
    actAs(guardian);
    const probe = await LINK(jsonRequest("http://local/api/portal/guardian/link", { trackingNo, phone: "01888000000" }));
    expect(probe.status).toBe(404);
    // …and with the factor passed, the conflict answer is a plain 409
    const conflict = await LINK(jsonRequest("http://local/api/portal/guardian/link", { trackingNo, phone: "01711000888" }));
    expect(conflict.status).toBe(409);
  });

  test("same guardian, same child → idempotent 200, no duplicate row", async () => {
    const guardian = await newGuardian("idempotent");
    const trackingNo = await createApplication({ guardianPhone: "01711001010", phone: "01711001111" });
    actAs(guardian);
    const first = await LINK(jsonRequest("http://local/api/portal/guardian/link", { trackingNo, phone: "01711001010" }));
    expect(first.status).toBe(201);
    const again = await LINK(jsonRequest("http://local/api/portal/guardian/link", { trackingNo, phone: "01711001010" }));
    expect(again.status).toBe(200);
    const json = (await again.json()) as { ok: boolean; data: { already: boolean } };
    expect(json.data.already).toBe(true);

    const links = await db.guardianLink.findMany({ where: { guardianUserId: guardian.userId } });
    expect(links.length).toBe(1);
    if (links[0]) await db.guardianLink.delete({ where: { id: links[0].id } });
  });

  test("role gate: an ALUMNI account is refused (403)", async () => {
    actAs(alumni);
    const res = await LINK(jsonRequest("http://local/api/portal/guardian/link", { trackingNo: "ASDRI-2099-123456", phone: "01711000000" }));
    expect(res.status).toBe(403);
  });

  test("CSRF is enforced (401 without the header)", async () => {
    const guardian = await newGuardian("csrf");
    actAs(guardian);
    const res = await LINK(
      jsonRequest("http://local/api/portal/guardian/link", { trackingNo: "ASDRI-2099-123456", phone: "01711000000" }, { "x-csrf-token": "" }),
    );
    expect(res.status).toBe(401);
  });

  test("the rate limit trips after the lookup-grade budget (429)", async () => {
    const prober = await newGuardian("rate-prober");
    actAs(prober);
    // burn the budget (LOOKUP_LIMITS: 8 per 15 min) — misses are free of
    // information but not of budget
    for (let i = 0; i < 8; i++) {
      const res = await LINK(jsonRequest("http://local/api/portal/guardian/link", { trackingNo: "ASDRI-2099-654321", phone: "01711000001" }));
      expect([404, 429]).toContain(res.status);
    }
    const limited = await LINK(jsonRequest("http://local/api/portal/guardian/link", { trackingNo: "ASDRI-2099-654321", phone: "01711000001" }));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBeTruthy();
  });
});
