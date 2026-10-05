import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { storage } from "@/lib/storage";
import { mediaAltUpdateSchema } from "@/lib/validators/admin-media";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Entity labels for the "in use" guard message (schema reverse relations). */
const USAGE_RELATIONS: Array<[string, string]> = [
  ["courseCovers", "কোর্স কভার"],
  ["personPhotos", "শিক্ষক/কর্মকর্তার ছবি"],
  ["facilityImages", "ক্যাম্পাস সুবিধা"],
  ["noticeAttachments", "নোটিশ সংযুক্তি"],
  ["postCovers", "ব্লগ পোস্ট কভার"],
  ["albumCovers", "গ্যালারি অ্যালবাম কভার"],
  ["albumImages", "গ্যালারি ছবি"],
  ["publicationFiles", "প্রকাশনার ফাইল"],
  ["publicationCovers", "প্রকাশনার কভার"],
  ["downloadFiles", "ডাউনলোড আইটেম"],
  ["campaignCovers", "ক্যাম্পেইন কভার"],
  ["applicationPhotos", "ভর্তি আবেদনের ছবি"],
  ["applicationDocs", "ভর্তি আবেদনের ডকুমেন্ট"],
];

/** Which entities currently reference this media row? */
async function findUsage(mediaId: string): Promise<string[]> {
  const row = await db.media.findUnique({
    where: { id: mediaId },
    include: Object.fromEntries(USAGE_RELATIONS.map(([rel]) => [rel, { select: { id: true } }])) as Prisma.MediaInclude,
  });
  if (!row) return [];
  const used: string[] = [];
  for (const [rel, label] of USAGE_RELATIONS) {
    const list = row[rel as keyof typeof row] as Array<{ id: string }>;
    if (Array.isArray(list) && list.length > 0) used.push(label);
  }
  return used;
}

/** PATCH /api/admin/media/[id] — inline alt text editing. */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "media");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.media.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "মিডিয়াটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = mediaAltUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "ফর্মের তথ্য যাচাই করুন।",
        fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])),
      },
      { status: 400 },
    );
  }

  const media = await db.media.update({ where: { id }, data: parsed.data });

  await audit(
    guard.session.user.id,
    "media.update",
    "Media",
    media.id,
    { before: { altBn: existing.altBn, altEn: existing.altEn }, after: { altBn: media.altBn, altEn: media.altEn } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { altBn: media.altBn, altEn: media.altEn } });
}

/** DELETE /api/admin/media/[id] — remove row + stored objects (incl. variants). */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "media");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.media.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "মিডিয়াটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  const usage = await findUsage(id);
  if (usage.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `এই ফাইলটি এখনো ব্যবহৃত হচ্ছে — ${usage.join(", ")}। আগে সেখান থেকে সরিয়ে নিন।`,
        usage,
      },
      { status: 409 },
    );
  }

  // remove stored objects: the original + any generated variants
  const keysToDelete: string[] = [existing.key];
  if (existing.variants && typeof existing.variants === "object") {
    for (const variant of Object.values(existing.variants as Record<string, { key?: string }>)) {
      if (variant && typeof variant.key === "string") keysToDelete.push(variant.key);
    }
  }
  const store = storage();
  await Promise.all(keysToDelete.map((key) => store.delete(key).catch(() => undefined)));

  await db.media.delete({ where: { id } });
  await audit(
    guard.session.user.id,
    "media.delete",
    "Media",
    id,
    { before: { filename: existing.filename, key: existing.key, kind: existing.kind } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true });
}
