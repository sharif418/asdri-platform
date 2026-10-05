import Link from "next/link";
import { Video } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VideoForm } from "@/components/admin/video-form";

export const metadata = { title: "নতুন ভিডিও" };

export default async function NewVideoPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content")) redirect("/admin");

  const playlists = await db.video.findMany({ distinct: ["playlistKey"], select: { playlistKey: true }, orderBy: { playlistKey: "asc" } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/videos" className="hover:text-primary">ভিডিও</Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">নতুন ভিডিও</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <Video aria-hidden className="h-6 w-6 text-primary" />
        নতুন ভিডিও যোগ করুন
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        ইউটিউব লিংক বসিয়ে দিন — আইডি, থাম্বনেইল ও এম্বেড স্বয়ংক্রিয়ভাবে ঠিক হয়ে যায়।
      </p>
      <VideoForm
        mode="create"
        playlists={playlists.map((row) => row.playlistKey)}
        initial={{ titleBn: "", titleEn: "", descriptionBn: "", descriptionEn: "", youtubeUrl: "", playlistKey: "", sortOrder: 0, isPublished: true }}
      />
    </div>
  );
}
