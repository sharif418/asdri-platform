import { redirect } from "next/navigation";
import { LayoutTemplate } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { HomeSectionsManager } from "@/components/admin/home-sections-manager";
import { StatsManager } from "@/components/admin/stats-manager";
import { HeroImageManager } from "@/components/admin/hero-image-manager";
import { getHeroMediaId } from "@/lib/settings";

export const metadata = { title: "হোম সেকশন ও পরিসংখ্যান" };

/** Home page composition editor: sections (order/enable/titles) + the stats band + hero image. */
export default async function AdminContentHomePage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content.manage")) redirect("/admin");

  const [sections, stats, heroMediaId] = await Promise.all([
    db.homeSection.findMany({ orderBy: { sortOrder: "asc" } }),
    db.stat.findMany({ orderBy: { sortOrder: "asc" } }),
    getHeroMediaId(),
  ]);

  const heroMedia = heroMediaId
    ? await db.media.findUnique({
        where: { id: heroMediaId },
        select: { id: true, filename: true, key: true, width: true, height: true, size: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <a href="/admin/content" className="hover:text-primary hover:underline">
          পেজ কনটেন্ট
        </a>
        <span aria-hidden>›</span>
        <span>হোম সেকশন</span>
      </div>
      <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold">
        <LayoutTemplate aria-hidden className="h-6 w-6 text-primary" />
        হোম সেকশন ও পরিসংখ্যান
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        হোম পেজে কোন সেকশন কোন ক্রমে দেখাবে তা এখানেই ঠিক হয় — সেকশন বন্ধ করলে প্রকাশ্য পেজ থেকে সরে যায়।
      </p>

      <div className="mt-6 space-y-8">
        <HomeSectionsManager sections={sections} />
        <StatsManager stats={stats} />
        <HeroImageManager current={heroMedia} />
      </div>
    </div>
  );
}
