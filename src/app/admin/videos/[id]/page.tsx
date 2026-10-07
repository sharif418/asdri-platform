import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Video } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { VideoForm } from "@/components/admin/video-form";

export const metadata = { title: "ভিডিও সম্পাদনা" };

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content.manage")) redirect("/admin");

  const { id } = await params;
  const [video, playlists] = await Promise.all([
    db.video.findUnique({ where: { id } }),
    db.video.findMany({ distinct: ["playlistKey"], select: { playlistKey: true }, orderBy: { playlistKey: "asc" } }),
  ]);
  if (!video) notFound();

  const playlistOptions = [...new Set([...playlists.map((row) => row.playlistKey), video.playlistKey])].sort((a, b) =>
    a.localeCompare(b, "bn"),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/videos" className="hover:text-primary">ভিডিও</Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">সম্পাদনা</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 truncate text-2xl font-bold">
        <Video aria-hidden className="h-6 w-6 shrink-0 text-primary" />
        {video.titleBn}
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        ভিডিও আইডি{" "}
        <code className="inline-block max-w-full break-all rounded bg-secondary px-1 align-bottom" dir="ltr">
          {video.youtubeId}
        </code>{" "}
        — পরিবর্তনগুলো অডিট লগে সংরক্ষিত হয়।
      </p>
      <VideoForm
        mode="edit"
        playlists={playlistOptions}
        initial={{
          id: video.id,
          titleBn: video.titleBn,
          titleEn: video.titleEn,
          descriptionBn: video.descriptionBn,
          descriptionEn: video.descriptionEn,
          youtubeUrl: video.youtubeId,
          playlistKey: video.playlistKey,
          sortOrder: video.sortOrder,
          isPublished: video.isPublished,
        }}
      />
    </div>
  );
}
