import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { createHash } from "node:crypto";

/**
 * Stream media from object storage through the app origin.
 * Keys are immutable (hash-named, dated) so responses carry
 * immutable + ETag; the browser and the CDN do the caching.
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

  const file = await storage().get(key);
  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  const etag = `"${createHash("md5").update(file.body).digest("hex")}"`;
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  }

  return new NextResponse(new Uint8Array(file.body), {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.body.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
