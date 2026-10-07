import { describe, test, expect, beforeAll } from "bun:test";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, roleCan, isStaff, STAFF_ROLES, canAccessModule } from "@/lib/auth";
import { installCookieMock, forgeCookie, newToken, tokenHash } from "../helpers/auth-forge";
import type { UserRole } from "@prisma/client";
import type { Permission } from "@/lib/permissions";

/**
 * Authorization matrix + password hashing + session lifecycle against the
 * test database (see tests/preload.ts).
 *
 * Round 4 moved access to PERMISSIONS (src/lib/permissions.ts): roleCan asks
 * a permission, canAccessModule maps admin modules to permissions once. The
 * assertions below pin the full role × permission matrix AND the module
 * mapping, so the source cannot drift silently.
 */

const ALL_ROLES: UserRole[] = [
  "ADMIN",
  "EDITOR",
  "ADMISSIONS",
  "FINANCE",
  "FATWA",
  "LIBRARIAN",
  "APPLICANT",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "DONOR",
  "ALUMNI",
];

/** The behavioural matrix: role → the permissions it must (not) carry. */
const PERMISSION_MATRIX: Record<UserRole, Permission[]> = {
  ADMIN: [], // everything via short-circuit — asserted separately
  EDITOR: [
    "media.upload",
    "media.manage",
    "content.manage",
    "academics.manage",
    "research.manage",
    "fatwa.read",
    "messages.read",
  ],
  ADMISSIONS: ["media.upload", "admissions.manage", "messages.read"],
  FINANCE: ["media.upload", "finance.read", "finance.manage"],
  FATWA: ["media.upload", "fatwa.read", "fatwa.answer", "fatwa.publish"],
  LIBRARIAN: ["media.upload", "library.manage"],
  APPLICANT: [],
  STUDENT: ["portal.student"],
  GUARDIAN: ["portal.guardian"],
  TEACHER: ["portal.teacher"],
  DONOR: ["portal.donor"],
  ALUMNI: ["portal.alumni"],
};

describe("roleCan permission matrix", () => {
  test("every role carries exactly its declared permissions", () => {
    for (const role of ALL_ROLES) {
      if (role === "ADMIN") continue;
      const allowed = PERMISSION_MATRIX[role];
      const every: Permission[] = [
        "settings.manage",
        "users.manage",
        "invitations.manage",
        "audit.view",
        "media.upload",
        "media.manage",
        "content.manage",
        "academics.manage",
        "research.manage",
        "admissions.manage",
        "finance.read",
        "finance.manage",
        "fatwa.read",
        "fatwa.answer",
        "fatwa.publish",
        "messages.read",
        "library.manage",
        "portal.student",
        "portal.guardian",
        "portal.teacher",
        "portal.donor",
        "portal.alumni",
      ];
      for (const permission of every) {
        expect(roleCan(role, permission)).toBe(allowed.includes(permission));
      }
    }
  });

  test("ADMIN passes every permission", () => {
    const adminChecks: Permission[] = ["settings.manage", "library.manage", "portal.guardian"];
    for (const permission of adminChecks) {
      expect(roleCan("ADMIN", permission)).toBe(true);
    }
  });

  test("an accountant cannot edit a curriculum; an editor cannot touch the ledger", () => {
    expect(roleCan("FINANCE", "academics.manage")).toBe(false);
    expect(canAccessModule("FINANCE", "academics")).toBe(false);
    expect(roleCan("EDITOR", "finance.manage")).toBe(false);
    expect(canAccessModule("EDITOR", "finance")).toBe(false);
  });

  test("portal roles never pass an admin module", () => {
    for (const role of ["STUDENT", "GUARDIAN", "TEACHER", "DONOR", "ALUMNI", "APPLICANT"] as UserRole[]) {
      for (const moduleName of [
        "settings",
        "users",
        "media",
        "content",
        "academics",
        "admissions",
        "finance",
        "fatwa",
        "messages",
        "library",
      ]) {
        expect(canAccessModule(role, moduleName)).toBe(false);
      }
    }
  });

  test("unknown module falls back to ADMIN-only (fail closed)", () => {
    for (const role of ALL_ROLES) {
      expect(canAccessModule(role, "no-such-module")).toBe(role === "ADMIN");
    }
  });

  test("the librarian reaches the library module and nothing else", () => {
    expect(canAccessModule("LIBRARIAN", "library")).toBe(true);
    expect(canAccessModule("LIBRARIAN", "content")).toBe(false);
    expect(canAccessModule("LIBRARIAN", "academics")).toBe(false);
  });
});

describe("isStaff", () => {
  test("the six staff roles, and only them", () => {
    expect(STAFF_ROLES).toEqual(["ADMIN", "EDITOR", "ADMISSIONS", "FINANCE", "FATWA", "LIBRARIAN"]);
    for (const role of STAFF_ROLES) expect(isStaff(role)).toBe(true);
    for (const role of ["APPLICANT", "STUDENT", "GUARDIAN", "TEACHER", "DONOR", "ALUMNI"] as UserRole[]) {
      expect(isStaff(role)).toBe(false);
    }
  });
});

describe("password hashing", () => {
  test("scrypt roundtrip + wrong password rejected", () => {
    const hash = hashPassword("correct horse battery staple");
    expect(verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
    expect(verifyPassword("", hash)).toBe(false);
    expect(hash.startsWith("scrypt:")).toBe(true);
  });
});

describe("session lifecycle", () => {
  let setCookie: (value: string | undefined) => void;
  beforeAll(() => {
    setCookie = installCookieMock();
  });

  test("a valid session resolves; a tampered cookie does not", async () => {
    const user = await db.user.create({
      data: {
        email: `authz-${Date.now()}@test.local`,
        name: "Authz Test",
        passwordHash: hashPassword("pass-word-123"),
        role: "EDITOR",
      },
    });
    const token = newToken();
    const session = await db.session.create({
      data: {
        userId: user.id,
        tokenHash: tokenHash(token),
        csrfToken: newToken(),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    setCookie(forgeCookie(session.id, token));
    const { getSession } = await import("@/lib/auth");
    const loaded = await getSession();
    expect(loaded?.user.id).toBe(user.id);
    expect(loaded?.user.role).toBe("EDITOR");

    // tampered signature fails before any DB roundtrip
    const parts = forgeCookie(session.id, token).split(".");
    const tampered = `${parts[0]}.${parts[1]}.${parts[2].slice(0, -2)}xx`;
    setCookie(tampered);
    const bad = await getSession();
    expect(bad).toBeNull();

    await db.session.deleteMany({ where: { userId: user.id } });
    await db.user.delete({ where: { id: user.id } });
  });
});
