import { describe, test, expect, beforeAll } from "bun:test";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Responsive media serving, through the REAL media route:
 * `?width=N` resolves to the sharp-generated webp variant closest to N
 * (smallest ≥ N, else the largest bucket). Junk/absent width, or a media row
 * without variants, falls back to the original bytes. The variant answer is
 * a different byte stream → a different ETag (so CDN/CDN-adjacent caches key
 * correctly), and PRIVATE gating is unchanged by the width parameter.
 */

process.env.SESSION_SECRET ??= "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2";

const { GET } = await import("@/app/api/media/[...key]/route");
const { storage } = await import("@/lib/storage");

function getRequest(key: string, query?: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/media/${key}${query ?? ""}`, { method: "GET" });
}

function paramsFor(key: string) {
  return { params: Promise.resolve({ key: key.split("/") }) };
}

/** Distinct payloads so each variant is byte-distinguishable. */
const originalBytes = Buffer.from("ORIGINAL-JPEG-BYTES-0123456789");
const thumbBytes = Buffer.from("THUMB-WEBP-400");
const mdBytes = Buffer.from("MD-WEBP-800-BYTES");
const lgBytes = Buffer.from("LG-WEBP-1200-BYTES!");

let withVariantsKey: string;
let noVariantsKey: string;
let privateKey: string;

const VARIANTS = {
  thumb: { key: "", width: 400, height: 229, size: thumbBytes.byteLength },
  md: { key: "", width: 800, height: 457, size: mdBytes.byteLength },
  lg: { key: "", width: 1200, height: 686, size: lgBytes.byteLength },
};

beforeAll(async () => {
  const stamp = Date.now();
  const store = storage();
  withVariantsKey = `2026/10/variants-${stamp}.jpg`;
  noVariantsKey = `2026/10/plain-${stamp}.jpg`;
  privateKey = `2026/10/private-v-${stamp}.jpg`;

  VARIANTS.thumb.key = `${withVariantsKey.slice(0, -4)}.thumb.webp`;
  VARIANTS.md.key = `${withVariantsKey.slice(0, -4)}.md.webp`;
  VARIANTS.lg.key = `${withVariantsKey.slice(0, -4)}.lg.webp`;

  await store.put(withVariantsKey, originalBytes, "image/jpeg");
  await store.put(VARIANTS.thumb.key, thumbBytes, "image/webp");
  await store.put(VARIANTS.md.key, mdBytes, "image/webp");
  await store.put(VARIANTS.lg.key, lgBytes, "image/webp");
  await store.put(noVariantsKey, originalBytes, "image/jpeg");
  await store.put(privateKey, originalBytes, "image/jpeg");

  await db.media.create({
    data: {
      key: withVariantsKey,
      filename: "hero.jpg",
      mime: "image/jpeg",
      size: originalBytes.byteLength,
      kind: "IMAGE",
      visibility: "PUBLIC",
      variants: VARIANTS,
    },
  });
  await db.media.create({
    data: {
      key: noVariantsKey,
      filename: "plain.jpg",
      mime: "image/jpeg",
      size: originalBytes.byteLength,
      kind: "IMAGE",
      visibility: "PUBLIC",
    },
  });
  await db.media.create({
    data: {
      key: privateKey,
      filename: "private.jpg",
      mime: "image/jpeg",
      size: originalBytes.byteLength,
      kind: "IMAGE",
      visibility: "PRIVATE",
    },
  });
});

async function bodyOf(res: Response): Promise<string> {
  return Buffer.from(await res.arrayBuffer()).toString("utf-8");
}

describe("GET /api/media/<key>?width=N (responsive variants)", () => {
  test("?width=800 serves the md webp variant (the phone-sized hero)", async () => {
    const res = await GET(getRequest(withVariantsKey, "?width=800"), paramsFor(withVariantsKey));
    expect(res.status).toBe(200);
    expect(await bodyOf(res)).toBe(mdBytes.toString("utf-8"));
    expect(res.headers.get("content-type")).toBe("image/webp");
  });

  test("?width=999 (between buckets) rounds UP to the lg 1200w variant", async () => {
    const res = await GET(getRequest(withVariantsKey, "?width=999"), paramsFor(withVariantsKey));
    expect(await bodyOf(res)).toBe(lgBytes.toString("utf-8"));
  });

  test("?width=300 (below every bucket) serves the smallest variant, not the original", async () => {
    const res = await GET(getRequest(withVariantsKey, "?width=300"), paramsFor(withVariantsKey));
    expect(await bodyOf(res)).toBe(thumbBytes.toString("utf-8"));
  });

  test("?width=99999 (above every bucket) serves the largest variant", async () => {
    const res = await GET(getRequest(withVariantsKey, "?width=99999"), paramsFor(withVariantsKey));
    expect(await bodyOf(res)).toBe(lgBytes.toString("utf-8"));
  });

  test("junk width falls back to the original bytes", async () => {
    for (const junk of ["?width=abc", "?width=-5", "?width=", "?width=0"]) {
      const res = await GET(getRequest(withVariantsKey, junk), paramsFor(withVariantsKey));
      expect(res.status).toBe(200);
      expect(await bodyOf(res)).toBe(originalBytes.toString("utf-8"));
    }
  });

  test("a media row WITHOUT variants serves the original regardless of width", async () => {
    const res = await GET(getRequest(noVariantsKey, "?width=800"), paramsFor(noVariantsKey));
    expect(res.status).toBe(200);
    expect(await bodyOf(res)).toBe(originalBytes.toString("utf-8"));
  });

  test("variant answers carry immutable caching and per-width ETags (304 flow intact)", async () => {
    const first = await GET(getRequest(withVariantsKey, "?width=800"), paramsFor(withVariantsKey));
    expect(first.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    const etag = first.headers.get("etag");
    expect(etag).toBeTruthy();

    const original = await GET(getRequest(withVariantsKey), paramsFor(withVariantsKey));
    expect(original.headers.get("etag")).not.toBe(etag); // different bytes → different ETag

    const cached = await GET(
      new NextRequest(`http://localhost:3000/api/media/${withVariantsKey}?width=800`, {
        method: "GET",
        headers: { "if-none-match": etag ?? "" },
      }),
      paramsFor(withVariantsKey),
    );
    expect(cached.status).toBe(304);
  });

  test("the privacy gate applies unchanged when a width is requested", async () => {
    const res = await GET(getRequest(privateKey, "?width=800"), paramsFor(privateKey));
    expect(res.status).toBe(401); // anonymous + PRIVATE → auth required, width irrelevant
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  test("unknown key + width is still a plain 404", async () => {
    const res = await GET(getRequest("2026/10/no-such-file.jpg", "?width=800"), paramsFor("2026/10/no-such-file.jpg"));
    expect(res.status).toBe(404);
  });
});
