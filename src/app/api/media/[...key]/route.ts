import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { getSession, isStaff } from "@/lib/auth";

/**
 * Stream media from object storage through the app origin.
 * Keys are immutable (hash-named, dated) so responses carry
 * immutable + ETag; the browser and the CDN do the caching.
 *
 * Round 3 — PRIVATE media (applicant identity documents, NID scans, photos):
 * the row is looked up by key; a private file is served only to its uploader
 * or staff (the office that processes applications). Anonymous requests get
 * 401, other sessions 403, and private responses are never cached publicly
 * (no-store, private) so a shared browser or CDN cannot retain them.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
): Promise<NextResponse> {
  const { key: parts } = await params;
  const key = parts.map(decodeURIComponent).join("/");
  // path traversal guard
  if (key.includes("..") || key.startsWith("/")) {
    return new NextResponse("Bad request", { status: 400 });
  }

  // Privacy gate: variant keys (…​.thumb.webp) belong to the same media row.
  const media = await db.media.findUnique({ where: { key } });
  if (media?.visibility === "PRIVATE") {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      });
    }
    const allowed =
      isStaff(session.user.role) || session.user.id === media.uploadedById;
    if (!allowed) {
      return new NextResponse("Forbidden", {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      });
    }
  }

  const file = await storage().get(key);
  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  const etag = `"${createHash("md5").update(file.body).digest("hex")}"`;
  const cacheControl =
    media?.visibility === "PRIVATE"
      ? "private, no-store" // identity documents must never sit in a shared cache
      : "public, max-age=31536000, immutable";

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": cacheControl },
    });
  }

  return new NextResponse(new Uint8Array(file.body), {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.body.byteLength),
      "Cache-Control": cacheControl,
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
