import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, verifyCsrf } from "@/lib/auth";
import { uploadImage, uploadDocument } from "@/lib/storage/upload";
import { isFeatureEnabled } from "@/lib/settings";
import { isSameOrigin, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Document upload for applications (applicant-authenticated).
 * Files are validated exactly like admin uploads: magic bytes + size caps.
 * Round 3: same-origin + CSRF (double-submit) + rate limit — identity
 * documents deserve the same guards as admin mutations — and every upload is
 * stored PRIVATE (served only to the uploader and staff, never anonymously).
 */

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_DOC = 10 * 1024 * 1024;

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "অননুমোদিত উৎস।" }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "আপলোড করতে লগইন করুন।" }, { status: 401 });
  }

  // Per-USER sliding window — IP rotation cannot bypass it.
  const limiter = rateLimit({ key: "admissions-documents", identifier: session.user.id, limit: 20, windowMs: 10 * 60_000 });
  if (!limiter.ok) {
    return NextResponse.json({ ok: false, error: "অনেকবার আপলোডের চেষ্টা হয়েছে, কিছুক্ষণ পর আবার করুন।" }, { status: 429 });
  }

  if (!(await isFeatureEnabled("admissions"))) {
    return NextResponse.json({ ok: false, error: "অনলাইন আবেদন বর্তমানে বন্ধ আছে।" }, { status: 403 });
  }

  if (!verifyCsrf(session.session, request.headers.get("x-csrf-token") ?? "")) {
    return NextResponse.json({ ok: false, error: "নিরাপত্তা টোকেন মেলেনি — পেজ রিফ্রেশ করে আবার চেষ্টা করুন।" }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ ok: false, error: "ফর্ম পার্স করা যায়নি।" }, { status: 400 });
  }

  const file = form.get("file");
  const kindSchema = z.enum(["IMAGE", "DOCUMENT"]);
  const kind = kindSchema.safeParse(form.get("kind") ?? "IMAGE");
  if (!(file instanceof File) || !kind.success) {
    return NextResponse.json({ ok: false, error: "ফাইল পাওয়া যায়নি।" }, { status: 400 });
  }

  const isImage = kind.data === "IMAGE";
  const limit = isImage ? MAX_IMAGE : MAX_DOC;
  if (file.size > limit) {
    return NextResponse.json(
      { ok: false, error: `ফাইল সাইজ সীমা ${Math.round(limit / 1024 / 1024)}MB।` },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());

  try {
    const uploaded = isImage ? await uploadImage(file.name, buf) : await uploadDocument(file.name, buf);
    const media = await db.media.create({
      data: {
        key: uploaded.key,
        filename: file.name.slice(0, 120),
        mime: uploaded.mime,
        size: uploaded.size,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        variants: (uploaded.variants ?? undefined) as never,
        kind: isImage ? "IMAGE" : "DOCUMENT",
        visibility: "PRIVATE", // identity documents are never public
        uploadedById: session.user.id,
        altBn: "আবেদন সংযুক্তি",
        altEn: "Application attachment",
      },
    });
    return NextResponse.json({ ok: true, data: { mediaId: media.id, key: media.key } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
