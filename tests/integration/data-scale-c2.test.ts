import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { installCookieMock, forgeCookie, newToken, tokenHash } from "../helpers/auth-forge";

/**
 * Round 11 (C.2) — the two data-scale closings:
 *
 *   1. Donation-ledger keyset pagination: the (createdAt, id) cursor walks
 *      chronological windows — gap-free, deterministic under timestamp ties,
 *      composable with the officer's filters, and malformed cursors degrade
 *      to the newest page. Exercises the real page wiring (window fetch +
 *      reversal + neighbor probes) through the lib's own where-builders.
 *   2. Audit CSV range-aware export: the from/to range (shared parser with
 *      the audit page's filter form) narrows the export, the filename
 *      carries the range, one-sided/malformed pairs are ignored, and the
 *      ADMIN-only guard holds.
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

const setCookie = installCookieMock();
const { GET: EXPORT_AUDIT } = await import("@/app/api/admin/audit/export/route");
const { parseDonationCursor, encodeDonationCursor, donationCursorWhere, donationNeighborProbes } = await import(
  "@/lib/finance/donation-cursor"
);

const stamp = Date.now();

/* ————— fixtures ————— */

let fundId = "";
const donationIds: string[] = [];
const WINDOW = 25; // the page's PAGE_SIZE, mirrored here for the walk math
const ROWS = 60; // 25 + 25 + 10 — three windows, the last partial

beforeAll(async () => {
  // a fund for the donation fixtures (cascade-deleted at the end)
  const fund = await db.fund.create({
    data: { key: `cursor-fund-${stamp}`, nameBn: "কার্সর পরীক্ষা ফান্ড", nameEn: "Cursor test fund", sortOrder: 999 },
  });
  fundId = fund.id;

  // 60 donations, minute-spaced, newest = highest index. Every 2nd row is
  // COMPLETED (30 > one window — the filtered walk spans two windows), the
  // rest PENDING.
  const base = new Date(Date.now() - 10 * 60 * 60 * 1000);
  for (let i = 0; i < ROWS; i += 1) {
    const row = await db.donation.create({
      data: {
        fundId,
        trackingCode: `DN-CURSOR-${stamp}-${String(i).padStart(4, "0")}`,
        amount: 100 + i,
        donorName: `কার্সর দাতা ${i}`,
        status: i % 2 === 0 ? "COMPLETED" : "PENDING",
        createdAt: new Date(base.getTime() + i * 60_000),
      },
    });
    donationIds.push(row.id);
  }
  // the timestamp-tie pair: same createdAt, distinct ids — ordering must be
  // deterministic via the id half of the key
  const tieAt = new Date(base.getTime() + 5 * 60_000);
  const tieFirst = await db.donation.create({
    data: { fundId, trackingCode: `DN-TIE1-${stamp}`, amount: 1, donorName: "টাই এ", createdAt: tieAt },
  });
  const tieSecond = await db.donation.create({
    data: { fundId, trackingCode: `DN-TIE2-${stamp}`, amount: 2, donorName: "টাই দুই", createdAt: tieAt },
  });
  donationIds.push(tieFirst.id, tieSecond.id);

  // audit rows in a known window (yesterday), one the day before
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db.auditLog.createMany({
    data: [
      { action: "cursor.range.test", entity: "Test", entityId: `r1-${stamp}`, createdAt: yesterday, diff: {} },
      { action: "cursor.range.test", entity: "Test", entityId: `r2-${stamp}`, createdAt: new Date(yesterday.getTime() + 3_600_000), diff: {} },
      { action: "cursor.range.test", entity: "Test", entityId: `r0-${stamp}`, createdAt: new Date(yesterday.getTime() - 24 * 60 * 60 * 1000), diff: {} },
    ],
  });
});

afterAll(async () => {
  await db.donation.deleteMany({ where: { id: { in: donationIds } } });
  await db.fund.deleteMany({ where: { id: fundId } });
  await db.auditLog.deleteMany({ where: { entity: "Test", entityId: { endsWith: String(stamp) } } });
});

/* ————— 1: keyset walk ————— */

/** The page's fetch logic, mirrored through the lib (desc window + probes). */
async function fetchWindow(filters: { fundId: string; status?: "PENDING" | "COMPLETED" }, cursor: ReturnType<typeof parseDonationCursor>, dir: "next" | "prev") {
  const where = cursor ? donationCursorWhere(filters, cursor, dir) : filters;
  const windowRows = await db.donation.findMany({
    where,
    orderBy: dir === "prev" ? [{ createdAt: "asc" }, { id: "asc" }] : [{ createdAt: "desc" }, { id: "desc" }],
    take: WINDOW,
    select: { id: true, createdAt: true },
  });
  const rows = dir === "prev" ? [...windowRows].reverse() : windowRows;
  const probes = donationNeighborProbes(filters, { first: rows[0]!, last: rows[rows.length - 1]! });
  const [older, newer] = await Promise.all([
    db.donation.findFirst({ where: probes.older, select: { id: true } }),
    db.donation.findFirst({ where: probes.newer, select: { id: true } }),
  ]);
  return { rows, hasOlder: older !== null, hasNewer: newer !== null };
}

describe("donation keyset cursor (lib + walk)", () => {
  test("malformed cursors parse to null — the page degrades to newest", () => {
    expect(parseDonationCursor(undefined)).toBeNull();
    expect(parseDonationCursor("")).toBeNull();
    expect(parseDonationCursor("garbage")).toBeNull();
    expect(parseDonationCursor("2026-13-99T00:00:00Z~abcde")).toBeNull();
    expect(parseDonationCursor("not-a-date~cmuyxxk72002wn2bjp5sjwh8s")).toBeNull();
    expect(parseDonationCursor("2026-10-08T12:00:00.000Z~")).toBeNull();
  });

  test("encode → parse roundtrip keeps the key", () => {
    const row = { createdAt: new Date("2026-10-08T12:34:56.789Z"), id: "cmuabc123def456ghi" };
    const parsed = parseDonationCursor(encodeDonationCursor(row));
    expect(parsed).not.toBeNull();
    expect(parsed!.id).toBe(row.id);
    expect(parsed!.createdAt.getTime()).toBe(row.createdAt.getTime());
  });

  test("the newest-first walk is gap-free across three windows", async () => {
    const filters = { fundId };
    const first = await fetchWindow(filters, null, "next");
    expect(first.rows.length).toBe(WINDOW);
    // the fund's rows, newest-first by createdAt — window 1 is the 25 newest
    const all = await db.donation.findMany({ where: filters, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true } });
    expect(first.rows.map((r) => r.id)).toEqual(all.slice(0, WINDOW).map((r) => r.id));
    expect(first.hasNewer).toBe(false); // we're at the top
    expect(first.hasOlder).toBe(true);

    // walk next from the window's last row
    const cursor1 = encodeDonationCursor(first.rows[first.rows.length - 1]!);
    const second = await fetchWindow(filters, parseDonationCursor(cursor1), "next");
    expect(second.rows.map((r) => r.id)).toEqual(all.slice(WINDOW, 2 * WINDOW).map((r) => r.id));
    expect(second.hasNewer).toBe(true);

    // walk prev from window 2's FIRST row — must land exactly on window 1
    const cursorBack = encodeDonationCursor(second.rows[0]!);
    const back = await fetchWindow(filters, parseDonationCursor(cursorBack), "prev");
    expect(back.rows.map((r) => r.id)).toEqual(all.slice(0, WINDOW).map((r) => r.id));
    expect(back.hasNewer).toBe(false);

    // walk to the partial last window (60 rows + 2 ties = 62; 25+25+12)
    const cursor2 = encodeDonationCursor(second.rows[second.rows.length - 1]!);
    const third = await fetchWindow(filters, parseDonationCursor(cursor2), "next");
    expect(third.rows.length).toBe(12);
    expect(third.hasOlder).toBe(false); // the oldest window
  });

  test("the cursor composes with the officer's status filter", async () => {
    const filters = { fundId, status: "COMPLETED" as const };
    const first = await fetchWindow(filters, null, "next");
    // window contents are only completed rows of this fund
    const statuses = await db.donation.findMany({ where: { id: { in: first.rows.map((r) => r.id) } }, select: { status: true, fundId: true } });
    expect(statuses.every((s) => s.status === "COMPLETED" && s.fundId === fundId)).toBe(true);
    // the walk count matches the filtered total (spans two windows: 25 + 5)
    const completedTotal = await db.donation.count({ where: filters });
    expect(completedTotal).toBeGreaterThan(WINDOW); // the walk is genuinely multi-window
    let walked = first.rows.length;
    let cursor = first.hasOlder && first.rows.length ? encodeDonationCursor(first.rows[first.rows.length - 1]!) : null;
    while (cursor) {
      const next = await fetchWindow(filters, parseDonationCursor(cursor), "next");
      walked += next.rows.length;
      cursor = next.hasOlder && next.rows.length ? encodeDonationCursor(next.rows[next.rows.length - 1]!) : null;
    }
    expect(walked).toBe(completedTotal);
  });

  test("timestamp ties order deterministically by the id half", async () => {
    const ties = await db.donation.findMany({
      where: { trackingCode: { in: [`DN-TIE1-${stamp}`, `DN-TIE2-${stamp}`] } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true },
    });
    const again = await db.donation.findMany({
      where: { trackingCode: { in: [`DN-TIE1-${stamp}`, `DN-TIE2-${stamp}`] } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true },
    });
    expect(ties.map((t) => t.id)).toEqual(again.map((t) => t.id)); // stable across queries
    expect(ties.length).toBe(2);
  });
});

/* ————— 2: audit CSV range ————— */

describe("GET /api/admin/audit/export (range-aware)", () => {
  test("ADMIN gets the range-narrowed CSV with the range in the filename", async () => {
    const actor = await makeAdmin("range-admin");
    setCookie(forgeCookie(actor.sessionId, actor.token));

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const res = await EXPORT_AUDIT(
      new NextRequest(`http://local/api/admin/audit/export?entity=Test&from=${yesterday}&to=${today}`),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toContain(`audit-log-${yesterday}_${today}`);

    const csv = (await res.text()).replace(/^\uFEFF/, "");
    const lines = csv.split("\r\n").filter(Boolean);
    // header + exactly the two in-window rows (the day-before row is out)
    expect(lines[0]).toBe("created_at,actor,actor_email,action,entity,entity_id,ip,diff");
    expect(lines.length).toBe(3);
    expect(csv).toContain(`r1-${stamp}`);
    expect(csv).toContain(`r2-${stamp}`);
    expect(csv).not.toContain(`r0-${stamp}`);
  });

  test("one-sided or malformed ranges are ignored (both-sides parser)", async () => {
    const actor = await makeAdmin("range-admin2");
    setCookie(forgeCookie(actor.sessionId, actor.token));

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const oneSided = await EXPORT_AUDIT(new NextRequest(`http://local/api/admin/audit/export?entity=Test&from=${yesterday}`));
    expect(oneSided.status).toBe(200);
    const csvOne = (await oneSided.text()).replace(/^\uFEFF/, "");
    // no range → no narrowing: the day-before row is back in the export
    expect(csvOne).toContain(`r0-${stamp}`);

    const malformed = await EXPORT_AUDIT(new NextRequest("http://local/api/admin/audit/export?entity=Test&from=nonsense&to=also-nonsense"));
    expect(malformed.status).toBe(200);
    const csvBad = (await malformed.text()).replace(/^\uFEFF/, "");
    expect(csvBad).toContain(`r0-${stamp}`);
  });

  test("non-admin is refused", async () => {
    const editor = await makeActor("EDITOR", "range-editor");
    setCookie(forgeCookie(editor.sessionId, editor.token));
    const res = await EXPORT_AUDIT(new NextRequest("http://local/api/admin/audit/export"));
    expect(res.status).toBe(403);
  });
});

/* ————— actors ————— */

interface SimpleActor {
  sessionId: string;
  token: string;
  userId: string;
}

async function makeActor(role: "ADMIN" | "EDITOR", label: string): Promise<SimpleActor> {
  const email = `${label}-${stamp}-${Math.floor(Math.random() * 1000)}@test.local`;
  const user = await db.user.create({
    data: { email, name: `রেঞ্জ পরীক্ষা ${label}`, role, passwordHash: hashPassword("password-12345") },
  });
  const token = newToken();
  const session = await db.session.create({
    data: { userId: user.id, tokenHash: tokenHash(token), csrfToken: "csrf-range", expiresAt: new Date(Date.now() + 60_000) },
  });
  actorCleanups.push(user.id, session.id);
  return { sessionId: session.id, token, userId: user.id };
}

async function makeAdmin(label: string): Promise<SimpleActor> {
  return makeActor("ADMIN", label);
}

const actorCleanups: string[] = [];

afterAll(async () => {
  // (second afterAll registration runs after the fixtures' one — order is fine
  // since sessions/users are independent of the donation fixtures)
  await db.session.deleteMany({ where: { id: { in: actorCleanups.filter((_, i) => i % 2 === 1) } } });
  await db.user.deleteMany({ where: { id: { in: actorCleanups.filter((_, i) => i % 2 === 0) } } });
});
