import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, getSession, roleCan, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { uploadImage, uploadDocument, sniffMime } from "@/lib/storage/upload";
import { mediaListQuerySchema } from "@/lib/validators/admin-media";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/** GET /api/admin/media — paginated library listing (picker + library grid).
 *  Read-only: session + role guard (no CSRF header — safe for plain GETs). */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!roleCan(session.user.role, "media")) return forbidden();

  const url = new URL(request.url);
  const parsed = mediaListQuerySchema.safeParse({
    kind: url.searchParams.get("kind") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "কোয়েরি সঠিক নয়।" }, { status: 400 });
  }

  const page = parsed.data.page ?? 1;
  const where = {
    ...(parsed.data.kind ? { kind: parsed.data.kind } : {}),
    ...(parsed.data.q
      ? {
          OR: [
            { filename: { contains: parsed.data.q, mode: "insensitive" as const } },
            { altBn: { contains: parsed.data.q } },
            { altEn: { contains: parsed.data.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    db.media.count({ where }),
    db.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        key: true,
        filename: true,
        mime: true,
        size: true,
        width: true,
        height: true,
        altBn: true,
        altEn: true,
        kind: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    data: { items, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
  });
}

/** POST /api/admin/media — multipart upload (all staff roles). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "media");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "আপলোড ফর্ম পার্স করা যায়নি।" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "ফাইল পাওয়া যায়নি — 'file' ফিল্ড দিন।" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffMime(buf);
  if (!sniffed) {
    return NextResponse.json(
      { ok: false, error: "ফাইলের ধরন সনাক্ত করা যায়নি (শুধু JPG, PNG, WEBP ছবি এবং PDF ডকুমেন্ট গ্রহণযোগ্য)।" },
      { status: 400 },
    );
  }

  const filename = sanitizeFilename(file.name || "upload");
  let uploaded;
  try {
    uploaded = sniffed === "application/pdf" ? await uploadDocument(filename, buf) : await uploadImage(filename, buf);
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }

  const media = await db.media.create({
    data: {
      key: uploaded.key,
      filename: uploaded.filename,
      mime: uploaded.mime,
      size: uploaded.size,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
      variants: (uploaded.variants ?? undefined) as never,
      kind: uploaded.kind,
      uploadedById: guard.session.user.id,
    },
    select: {
      id: true,
      key: true,
      filename: true,
      mime: true,
      size: true,
      width: true,
      height: true,
      altBn: true,
      altEn: true,
      kind: true,
      createdAt: true,
    },
  });

  await audit(
    guard.session.user.id,
    "media.upload",
    "Media",
    media.id,
    { after: { filename: media.filename, kind: media.kind, size: media.size } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: media }, { status: 201 });
}

/** Keep a basename with safe characters only. */
function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[\\/]/g, "_")
      .replace(/[\u0000-\u001f]/g, "")
      .slice(0, 180) || "upload"
  );
}
