import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { parseYouTubeId } from "@/lib/youtube";
import { videoUpdateSchema } from "@/lib/validators/admin-content";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/videos/[id] — update a video (ADMIN, EDITOR). */
export async function PATCH(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.video.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "ভিডিওটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = videoUpdateSchema.safeParse(body);
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

  const data = parsed.data;
  let youtubeId: string | undefined;
  if (data.youtubeUrl !== undefined) {
    const parsedId = parseYouTubeId(data.youtubeUrl);
    if (!parsedId) {
      return NextResponse.json(
        {
          ok: false,
          error: "ইউটিউব লিংক বা আইডি পড়া যায়নি — সরাসরি লিংক (watch / youtu.be / shorts) বা ১১ অক্ষরের আইডি দিন।",
          fields: { youtubeUrl: "লিংক বৈধ নয়" },
        },
        { status: 400 },
      );
    }
    youtubeId = parsedId;
  }

  const { youtubeUrl: _url, ...rest } = data;
  const video = await db.video.update({
    where: { id },
    data: { ...rest, ...(youtubeId !== undefined ? { youtubeId } : {}) },
  });

  await audit(
    guard.session.user.id,
    "video.update",
    "Video",
    video.id,
    {
      before: { titleBn: existing.titleBn, playlistKey: existing.playlistKey, isPublished: existing.isPublished },
      after: { titleBn: video.titleBn, playlistKey: video.playlistKey, isPublished: video.isPublished },
    },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/videos/[id] — remove a video (ADMIN, EDITOR). */
export async function DELETE(request: NextRequest, { params }: Params): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const { id } = await params;
  const existing = await db.video.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "ভিডিওটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
  }

  await db.video.delete({ where: { id } });
  await audit(guard.session.user.id, "video.delete", "Video", id, { before: { titleBn: existing.titleBn, youtubeId: existing.youtubeId } }, request.headers.get("x-real-ip"));

  return NextResponse.json({ ok: true });
}
