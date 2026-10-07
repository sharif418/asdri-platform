import Link from "next/link";
import { Plus, Video } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "ভিডিও" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Videos list — grouped by playlist key. */
export default async function AdminVideosPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content.manage")) redirect("/admin");

  const sp = await searchParams;
  const playlist = typeof sp.playlist === "string" ? sp.playlist.trim().slice(0, 120) : "";

  const videos = await db.video.findMany({
    where: playlist ? { playlistKey: playlist } : undefined,
    orderBy: [{ playlistKey: "asc" }, { sortOrder: "asc" }],
    select: { id: true, titleBn: true, titleEn: true, youtubeId: true, playlistKey: true, sortOrder: true, isPublished: true },
  });

  const playlists = [...new Set(videos.map((video) => video.playlistKey))];
  const grouped = playlists.map((key) => ({ key, videos: videos.filter((video) => video.playlistKey === key) }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <Video aria-hidden className="h-6 w-6 text-primary" />
            ভিডিও
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            প্লেলিস্টভিত্তিক ভিডিও তালিকা — লেকচার, পডকাস্ট, সংক্ষিপ্ত সংশয় নিরসন।
          </p>
        </div>
        <Link
          href="/admin/videos/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus aria-hidden className="h-4 w-4" />
          নতুন ভিডিও
        </Link>
      </div>

      {playlist && (
        <p className="mt-4 text-sm text-muted-foreground">
          প্লেলিস্ট ফিল্টার: <span className="font-semibold text-foreground">{playlist}</span> ·{" "}
          <Link href="/admin/videos" className="font-semibold text-primary hover:underline">
            ফিল্টার খুলে ফেলুন
          </Link>
        </p>
      )}

      {videos.length === 0 ? (
        <div className="mt-4 rounded-2xl border bg-card px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold">কোনো ভিডিও পাওয়া যায়নি</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {playlist ? "এই প্লেলিস্টে কোনো ভিডিও নেই।" : "প্রথম ভিডিওটি যোগ করুন — লিংক দিলেই হবে।"}
          </p>
          <Link href="/admin/videos/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Plus aria-hidden className="h-4 w-4" />
            ভিডিও যোগ করুন
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {grouped.map(({ key, videos: members }) => (
            <section key={key || "—"}>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-base font-bold">{key || "প্লেলিস্টহীন"}</h2>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {formatNumber(members.length, "bn")}
                </span>
              </div>
              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {members.map((video) => (
                  <Link
                    key={video.id}
                    href={`/admin/videos/${video.id}`}
                    className="flex min-w-0 items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:border-gold/50"
                  >
                    <span
                      className={cn(
                        "flex h-11 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
                        !video.isPublished && "bg-muted text-muted-foreground",
                      )}
                    >
                      <Video aria-hidden className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold">{video.titleBn}</p>
                      <p className="break-all text-[11.5px] text-muted-foreground" dir="ltr">
                        {video.youtubeId}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {video.youtubeId.includes("ASDRI000") && (
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                          প্লেসহোল্ডার
                        </span>
                      )}
                      <span className={cn("text-[10.5px] font-bold", video.isPublished ? "text-primary" : "text-muted-foreground")}>
                        {video.isPublished ? "প্রকাশিত" : "ড্রাফট"}
                      </span>
                      <span className="text-[10.5px] text-muted-foreground">ক্রম {formatNumber(video.sortOrder, "bn")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
