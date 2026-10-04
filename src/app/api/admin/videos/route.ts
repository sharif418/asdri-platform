import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { parseYouTubeId } from "@/lib/youtube";
import { videoCreateSchema } from "@/lib/validators/admin-content";

export const dynamic = "force-dynamic";

/** POST /api/admin/videos — create a video (ADMIN, EDITOR). */
export async function POST(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "content");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "অনুরোধের বডি পার্স করা যায়নি।" }, { status: 400 });
  }

  const parsed = videoCreateSchema.safeParse(body);
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
  const youtubeId = parseYouTubeId(data.youtubeUrl);
  if (!youtubeId) {
    return NextResponse.json(
      {
        ok: false,
        error: "ইউটিউব লিংক বা আইডি পড়া যায়নি — সরাসরি লিংক (watch / youtu.be / shorts) বা ১১ অক্ষরের আইডি দিন।",
        fields: { youtubeUrl: "লিংক বৈধ নয়" },
      },
      { status: 400 },
    );
  }

  const video = await db.video.create({
    data: {
      titleBn: data.titleBn,
      titleEn: data.titleEn,
      descriptionBn: data.descriptionBn,
      descriptionEn: data.descriptionEn,
      youtubeId,
      playlistKey: data.playlistKey,
      sortOrder: data.sortOrder,
      isPublished: data.isPublished,
    },
  });

  await audit(
    guard.session.user.id,
    "video.create",
    "Video",
    video.id,
    { after: { titleBn: video.titleBn, youtubeId: video.youtubeId, playlistKey: video.playlistKey } },
    request.headers.get("x-real-ip"),
  );

  return NextResponse.json({ ok: true, data: { id: video.id } }, { status: 201 });
}
