import { describe, test, expect, beforeAll } from "bun:test";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, roleCan, isStaff, STAFF_ROLES } from "@/lib/auth";
import { installCookieMock, forgeCookie, newToken, tokenHash } from "../helpers/auth-forge";
import type { UserRole } from "@prisma/client";

/**
 * Authorization matrix + password hashing + session lifecycle against the
 * test database (see tests/preload.ts).
 *
 * MODULE_ROLES itself is not exported from src/lib/auth.ts, so the module
 * list below mirrors it — the assertions pin the full role × module matrix
 * and fail if the source matrix drifts.
 */

const MODULE_MATRIX: Record<string, UserRole[]> = {
  settings: ["ADMIN"],
  users: ["ADMIN"],
  flags: ["ADMIN"],
  menus: ["ADMIN", "EDITOR"],
  media: ["ADMIN", "EDITOR", "ADMISSIONS", "FINANCE", "FATWA"],
  content: ["ADMIN", "EDITOR"],
  academics: ["ADMIN", "EDITOR"],
  admissions: ["ADMIN", "ADMISSIONS"],
  finance: ["ADMIN", "FINANCE"],
  fatwa: ["ADMIN", "FATWA", "EDITOR"],
  audit: ["ADMIN"],
  messages: ["ADMIN", "EDITOR", "ADMISSIONS"],
};

const ALL_ROLES: UserRole[] = ["ADMIN", "EDITOR", "ADMISSIONS", "FINANCE", "FATWA", "APPLICANT"];

describe("roleCan permission matrix", () => {
  test("every module × every role matches the expected allow/deny", () => {
    for (const [module, allowed] of Object.entries(MODULE_MATRIX)) {
      for (const role of ALL_ROLES) {
        const expected = allowed.includes(role);
        expect(roleCan(role, module)).toBe(expected);
      }
    }
  });

  test("unknown module falls back to ADMIN-only", () => {
    for (const role of ALL_ROLES) {
      expect(roleCan(role, "no-such-module")).toBe(role === "ADMIN");
    }
    expect(roleCan("APPLICANT", "donations-admin")).toBe(false);
  });

  test("APPLICANT can never mutate an admin module", () => {
    for (const moduleName of Object.keys(MODULE_MATRIX)) {
      expect(roleCan("APPLICANT", moduleName)).toBe(false);
    }
  });

  test("ADMIN is allowed everywhere (matrix + fallback)", () => {
    for (const moduleName of [...Object.keys(MODULE_MATRIX), "anything-else"]) {
      expect(roleCan("ADMIN", moduleName)).toBe(true);
    }
  });
});

describe("isStaff", () => {
  test("the five staff roles, and only them", () => {
    expect(STAFF_ROLES).toEqual(["ADMIN", "EDITOR", "ADMISSIONS", "FINANCE", "FATWA"]);
    for (const role of STAFF_ROLES) expect(isStaff(role)).toBe(true);
    expect(isStaff("APPLICANT")).toBe(false);
  });
});

describe("hashPassword / verifyPassword", () => {
  test("round-trips a correct password and rejects a wrong one", () => {
    const stored = hashPassword("correct horse battery staple");
    expect(stored.startsWith("scrypt:")).toBe(true);
    expect(stored.split(":").length).toBe(3);
    expect(verifyPassword("correct horse battery staple", stored)).toBe(true);
    expect(verifyPassword("wrong password", stored)).toBe(false);
  });

  test("every hash is salted (two hashes of the same password differ)", () => {
    expect(hashPassword("same-password")).not.toBe(hashPassword("same-password"));
  });

  test("malformed stored hashes never verify (and never throw)", () => {
    expect(verifyPassword("x", "")).toBe(false);
    expect(verifyPassword("x", "plaintext")).toBe(false);
    expect(verifyPassword("x", "bcrypt:salt:hash")).toBe(false);
    expect(verifyPassword("x", "scrypt:missing")).toBe(false);
    expect(verifyPassword("x", "scrypt:not-hex:hash")).toBe(false);
  });
});

describe("session lifecycle (DB-backed, signed cookie)", () => {
  const setCookie = installCookieMock();
  let userId: string;
  let cookieValue: string;

  beforeAll(async () => {
    const user = await db.user.create({
      data: {
        email: `authz-${Date.now()}@test.local`,
        name: "Authz Probe",
        passwordHash: hashPassword("Password123!"),
        role: "EDITOR",
      },
    });
    userId = user.id;
  });

  test("createSession stores a sha256(token) row and returns a 3-part signed cookie", async () => {
    const { createSession } = await import("@/lib/auth");
    const created = await createSession(userId);
    expect(created.cookieValue.split(".")).toHaveLength(3);
    expect(created.maxAge).toBe(60 * 60 * 24 * 7);

    const [sessionId, token, mac] = created.cookieValue.split(".");
    const row = await db.session.findUniqueOrThrow({ where: { id: sessionId } });
    expect(row.tokenHash).toBe(tokenHash(token)); // only the hash is stored
    expect(row.csrfToken).toBe(created.csrfToken);
    expect(row.userId).toBe(userId);
    expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(mac.length).toBeGreaterThan(10);
    cookieValue = created.cookieValue;
  });

  test("getSession resolves the user for a valid forged cookie", async () => {
    const { getSession } = await import("@/lib/auth");
    setCookie(cookieValue);
    const session = await getSession();
    expect(session?.user.id).toBe(userId);
    expect(session?.user.email).toContain("@test.local");
    expect(session?.session.userId).toBe(userId);
  });

  test("a tampered MAC is rejected before any DB roundtrip", async () => {
    const { getSession } = await import("@/lib/auth");
    const [id, token] = cookieValue.split(".");
    setCookie(`${id}.${token}.forged-mac-value`);
    expect(await getSession()).toBeNull();
  });

  test("an unknown session id (valid MAC, deleted row) is rejected", async () => {
    const { getSession } = await import("@/lib/auth");
    setCookie(forgeCookie("missing-session-id", newToken()));
    expect(await getSession()).toBeNull();
  });

  test("a token that does not hash to the stored row is rejected", async () => {
    const { getSession } = await import("@/lib/auth");
    const [id] = cookieValue.split(".");
    setCookie(forgeCookie(id, newToken())); // right session, wrong token
    expect(await getSession()).toBeNull();
  });

  test("an expired session is rejected and deleted from the store", async () => {
    const { getSession } = await import("@/lib/auth");
    const expiredToken = newToken();
    const row = await db.session.create({
      data: {
        userId,
        tokenHash: tokenHash(expiredToken),
        csrfToken: "csrf-expired",
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    setCookie(forgeCookie(row.id, expiredToken));
    expect(await getSession()).toBeNull();
    expect(await db.session.findUnique({ where: { id: row.id } })).toBeNull(); // reaped
  });

  test("a deactivated user's session is rejected and reaped", async () => {
    const { getSession } = await import("@/lib/auth");
    const inactive = await db.user.create({
      data: {
        email: `inactive-${Date.now()}@test.local`,
        name: "Inactive",
        passwordHash: hashPassword("Password123!"),
        role: "EDITOR",
        isActive: false,
      },
    });
    const created = await (await import("@/lib/auth")).createSession(inactive.id);
    setCookie(created.cookieValue);
    expect(await getSession()).toBeNull();
    expect(await db.session.findUnique({ where: { id: created.cookieValue.split(".")[0] } })).toBeNull();
  });

  test("destroySession removes the row", async () => {
    const { createSession, destroySession } = await import("@/lib/auth");
    const created = await createSession(userId);
    const sessionId = created.cookieValue.split(".")[0];
    await destroySession(sessionId);
    expect(await db.session.findUnique({ where: { id: sessionId } })).toBeNull();
  });
});

describe("verifyCsrf (timing-safe double-submit compare)", () => {
  test("accepts only the exact session token", async () => {
    const { createSession, verifyCsrf } = await import("@/lib/auth");
    const user = await db.user.findFirstOrThrow({ where: { email: { contains: "@test.local" } } });
    const created = await createSession(user.id);
    const row = await db.session.findUniqueOrThrow({ where: { id: created.cookieValue.split(".")[0] } });

    expect(verifyCsrf(row, created.csrfToken)).toBe(true);
    expect(verifyCsrf(row, `wrong-${created.csrfToken}`)).toBe(false);
    expect(verifyCsrf(row, null)).toBe(false);
    expect(verifyCsrf(row, "")).toBe(false);
  });
});
