import type { Metadata } from "next";
import type { Lang } from "@/lib/locale";
import { alternatesFor } from "@/lib/locale";
import { env } from "@/lib/env";
import { Hero } from "@/components/home/hero";
import { db } from "@/lib/db";
import { getHeroMediaId } from "@/lib/settings";
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
import { getSiteConfig } from "@/lib/content/site";
import { getInstituteStats } from "@/lib/content/stats";
import { getHomeSections, getUrgentNotice } from "@/lib/content/home";
import type { ReactNode } from "react";
import { Fragment } from "react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const isBn = lang === "bn";
  const siteConfig = await getSiteConfig();
  const { canonical, languages } = alternatesFor("/", env.siteUrl);
  return {
    title: isBn ? `${siteConfig.nameBn} — ${siteConfig.parentBn}` : `${siteConfig.nameEn} — ${siteConfig.parentEn}`,
    description: isBn ? siteConfig.taglineBn : siteConfig.taglineEn,
    alternates: { canonical, languages },
  };
}

/** Home — composes the signature sections in the DB's enabled order. */
export default async function HomePage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;

  // Editorial curation: urgent strip renders above the hero only while a
  // pinned notice exists (newest pinned first).
  const [topPinned, stats, sections, heroMediaId] = await Promise.all([
    getUrgentNotice(),
    getInstituteStats(),
    getHomeSections(),
    getHeroMediaId(),
  ]);

  // Office-chosen hero image (site.hero setting); null → default campus photo.
  const heroMedia = heroMediaId
    ? await db.media.findUnique({ where: { id: heroMediaId }, select: { key: true } })
    : null;
  const heroImageUrl = heroMedia ? `/api/media/${heroMedia.key}` : null;

  const sectionsByKey: Record<string, ReactNode> = {
    hero: <Hero lang={lang} heroImageUrl={heroImageUrl} />,
    stats: <StatsBand lang={lang} stats={stats} />,
    vision: <VisionPillars lang={lang} />,
    programs: <FeaturedPrograms lang={lang} />,
    research: <ResearchHighlights lang={lang} />,
    notices: <NoticesFeed lang={lang} />,
    campus: <CampusLife lang={lang} />,
    media: <MediaHub lang={lang} />,
    leadership: <LeadershipShowcase lang={lang} />,
    support: <SupportSection lang={lang} />,
    fatwa: <FatwaGateway lang={lang} />,
  };

  return (
    <>
      {topPinned ? <UrgentStrip lang={lang} notice={topPinned} /> : null}
      {sections.map((key) => (
        <Fragment key={key}>{sectionsByKey[key] ?? null}</Fragment>
      ))}
    </>
  );
}
