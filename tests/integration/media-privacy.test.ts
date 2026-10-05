import { describe, test, expect, beforeAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { installCookieMock } from "../helpers/auth-forge";

/**
 * Round-3 identity-document privacy, through the REAL media route:
 * PRIVATE media (applicant photo/NID/transcript uploads) is served only to
 * its uploader or staff; anonymous requests get 401, other sessions 403, and
 * the response is never publicly cacheable. PUBLIC media behaves as before.
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

const setCookie = installCookieMock();
const { GET } = await import("@/app/api/media/[...key]/route");
const { createSession } = await import("@/lib/auth");
const { storage } = await import("@/lib/storage");

const mediaUrl = (key: string) => `http://localhost:3000/api/media/${key}`;

function getRequest(key: string): NextRequest {
  return new NextRequest(mediaUrl(key), { method: "GET" });
}

/** Minimal PNG body (magic bytes only is enough for the local-disk driver). */
const pngBytes = Buffer.from(
  "89504e470d0a1a0a0000000d494844520000000100000001080600000" +
    "01f15c4890000000a49444154789c6300010000050001",
  "hex",
);

let uploaderSession: { cookieValue: string; csrfToken: string };
let strangerSession: { cookieValue: string; csrfToken: string };
let staffSession: { cookieValue: string; csrfToken: string };
let privateKey: string;
let publicKey: string;

beforeAll(async () => {
  const uploader = await db.user.create({
    data: {
      email: `media-owner-${Date.now()}@test.local`,
      name: "মালিক",
      passwordHash: hashPassword("Password123!"),
      role: "APPLICANT",
    },
  });
  const stranger = await db.user.create({
    data: {
      email: `media-stranger-${Date.now()}@test.local`,
      name: "অপরিচিত",
      passwordHash: hashPassword("Password123!"),
      role: "APPLICANT",
    },
  });
  const staff = await db.user.create({
    data: {
      email: `media-staff-${Date.now()}@test.local`,
      name: "কর্মকর্তা",
      passwordHash: hashPassword("Password123!"),
      role: "ADMISSIONS",
    },
  });

  uploaderSession = await createSession(uploader.id);
  strangerSession = await createSession(stranger.id);
  staffSession = await createSession(staff.id);

  // Store two files on the real storage driver and register their Media rows.
  const store = storage();
  privateKey = `2026/10/private-${Date.now()}.png`;
  publicKey = `2026/10/public-${Date.now()}.png`;
  await store.put(privateKey, pngBytes, "image/png");
  await store.put(publicKey, pngBytes, "image/png");

  await db.media.create({
    data: {
      key: privateKey,
      filename: "nid-scan.png",
      mime: "image/png",
      size: pngBytes.byteLength,
      kind: "IMAGE",
      visibility: "PRIVATE",
      uploadedById: uploader.id,
    },
  });
  await db.media.create({
    data: {
      key: publicKey,
      filename: "campus.png",
      mime: "image/png",
      size: pngBytes.byteLength,
      kind: "IMAGE",
      visibility: "PUBLIC",
    },
  });
});

describe("GET /api/media/<key> (visibility gate)", () => {
  test("a PRIVATE key is 401 for an anonymous visitor (no more URL-is-the-auth)", async () => {
    setCookie(undefined);
    const res = await GET(getRequest(privateKey), { params: Promise.resolve({ key: privateKey.split("/") }) });
    expect(res.status).toBe(401);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  test("a PRIVATE key is 403 for a logged-in non-owner (stranger applicant)", async () => {
    setCookie(strangerSession.cookieValue);
    const res = await GET(getRequest(privateKey), { params: Promise.resolve({ key: privateKey.split("/") }) });
    expect(res.status).toBe(403);
  });

  test("a PRIVATE key is 200 for its uploader, with private no-store caching", async () => {
    setCookie(uploaderSession.cookieValue);
    const res = await GET(getRequest(privateKey), { params: Promise.resolve({ key: privateKey.split("/") }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  test("a PRIVATE key is 200 for staff (the office processing applications)", async () => {
    setCookie(staffSession.cookieValue);
    const res = await GET(getRequest(privateKey), { params: Promise.resolve({ key: privateKey.split("/") }) });
    expect(res.status).toBe(200);
  });

  test("a PUBLIC key stays anonymous + immutable-cached (no behaviour change)", async () => {
    setCookie(undefined);
    const res = await GET(getRequest(publicKey), { params: Promise.resolve({ key: publicKey.split("/") }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
  });

  test("traversal attempts are still refused before any lookup", async () => {
    setCookie(undefined);
    const res = await GET(getRequest("2026/../../etc/passwd"), {
      params: Promise.resolve({ key: ["2026", "..", "..", "etc", "passwd"] }),
    });
    expect(res.status).toBe(400);
  });
});
