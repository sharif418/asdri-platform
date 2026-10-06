import type { Metadata } from "next";
import { Suspense } from "react";
import type { Lang } from "@/lib/locale";
import { alternatesFor } from "@/lib/locale";
import { env } from "@/lib/env";
import { Hero } from "@/components/home/hero";
import { db } from "@/lib/db";
import { getHeroMediaId } from "@/lib/settings";
import { parseYouTubeId } from "@/lib/youtube";
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

/**
 * Streaming placeholder for below-fold sections: keeps the scrollbar
 * geometry roughly stable while the section's DB data resolves, without
 * shipping any skeleton markup that would flash.
 */
function SectionStream({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div aria-hidden className="min-h-[420px]" />}>
      {children}
    </Suspense>
  );
}

/** Home — composes the signature sections in the DB's enabled order.
 *
 * Round 4 payload diet: only the first screen (urgent strip, hero, impact
 * stats) is awaited before the document flushes; every below-fold section
 * fetches its own data and streams in behind a Suspense boundary, so the
 * hero paints on the earliest possible byte stream (LCP) while the bank of
 * sections still ships as crawlable HTML.
 */
export default async function HomePage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;

  // Editorial curation: urgent strip renders above the hero only while a
  // pinned notice exists (newest pinned first). These queries are tiny and
  // belong to the first paint.
  const [topPinned, stats, sections, heroMediaId, featuredVideo] = await Promise.all([
    getUrgentNotice(),
    getInstituteStats(),
    getHomeSections(),
    getHeroMediaId(),
    // Featured intro video for the hero dialog (first published, office order).
    db.video.findFirst({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
      select: { youtubeId: true, titleBn: true, titleEn: true },
    }),
  ]);

  // Office-chosen hero image (site.hero setting); null → default campus photo.
  const heroMedia = heroMediaId
    ? await db.media.findUnique({ where: { id: heroMediaId }, select: { key: true } })
    : null;
  const heroImageUrl = heroMedia ? `/api/media/${heroMedia.key}` : null;
  // NOTE: no <link rel=preload> — the Hero renders the backdrop as an <img
  // fetchPriority=high> with a width-aware srcSet, which is itself the
  // priority hint and lets the browser pick the sized webp variant.

  // The office stores whatever they paste (bare id / watch url / youtu.be);
  // the hero embed only accepts a canonical 11-char id.
  const heroVideo = featuredVideo && parseYouTubeId(featuredVideo.youtubeId)
    ? {
        id: parseYouTubeId(featuredVideo.youtubeId) as string,
        title: { bn: featuredVideo.titleBn, en: featuredVideo.titleEn },
      }
    : null;

  const sectionsByKey: Record<string, ReactNode> = {
    hero: <Hero lang={lang} heroImageUrl={heroImageUrl} video={heroVideo} />,
    stats: <StatsBand lang={lang} stats={stats} />,
    vision: (
      <SectionStream>
        <VisionPillars lang={lang} />
      </SectionStream>
    ),
    programs: (
      <SectionStream>
        <FeaturedPrograms lang={lang} />
      </SectionStream>
    ),
    research: (
      <SectionStream>
        <ResearchHighlights lang={lang} />
      </SectionStream>
    ),
    notices: (
      <SectionStream>
        <NoticesFeed lang={lang} />
      </SectionStream>
    ),
    campus: (
      <SectionStream>
        <CampusLife lang={lang} />
      </SectionStream>
    ),
    media: (
      <SectionStream>
        <MediaHub lang={lang} />
      </SectionStream>
    ),
    leadership: (
      <SectionStream>
        <LeadershipShowcase lang={lang} />
      </SectionStream>
    ),
    support: (
      <SectionStream>
        <SupportSection lang={lang} />
      </SectionStream>
    ),
    fatwa: (
      <SectionStream>
        <FatwaGateway lang={lang} />
      </SectionStream>
    ),
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
