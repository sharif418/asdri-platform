import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getLang } from "@/lib/i18n-server";
import { Hero } from "@/components/home/hero";
import { StatsBand } from "@/components/home/stats-band";
import { VisionPillars } from "@/components/home/vision-pillars";
import { FeaturedPrograms } from "@/components/home/featured-programs";
import { ResearchHighlights } from "@/components/home/research-highlights";
import { NoticesFeed } from "@/components/home/notices-feed";
import { CampusLife } from "@/components/home/campus-life";
import { MediaHub } from "@/components/home/media-hub";
import { LeadershipShowcase } from "@/components/home/leadership-showcase";
import { SupportSection } from "@/components/home/support-section";
import { FatwaGateway } from "@/components/home/fatwa-gateway";
import { UrgentStrip } from "@/components/home/urgent-strip";
import { siteConfig } from "@/content/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${siteConfig.nameBn} — ${siteConfig.parentBn}`,
  description: siteConfig.taglineBn,
};

/** Home — composes the 12 signature sections of the institute. */
export default async function HomePage() {
  const lang = await getLang();

  // Editorial curation: urgent strip renders above the hero only while a
  // pinned notice exists (newest pinned first).
  const topPinned = await db.notice.findFirst({
    where: { pinned: true },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, titleBn: true, titleEn: true },
  });

  return (
    <>
      {topPinned ? <UrgentStrip lang={lang} notice={topPinned} /> : null}
      <Hero lang={lang} />
      <StatsBand lang={lang} />
      <VisionPillars lang={lang} />
      <FeaturedPrograms lang={lang} />
      <ResearchHighlights lang={lang} />
      <NoticesFeed lang={lang} />
      <CampusLife lang={lang} />
      <MediaHub lang={lang} />
      <LeadershipShowcase lang={lang} />
      <SupportSection lang={lang} />
      <FatwaGateway lang={lang} />
    </>
  );
}
