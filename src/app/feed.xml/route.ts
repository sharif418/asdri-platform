import { db } from "@/lib/db";
import { siteConfig } from "@/content/site";
import { isLang, langPath, type Lang } from "@/lib/locale";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://assunnahinstitute.org";

/** Per-language channel metadata (`?lang=en` serves the English variant). */
const FEED_CHANNELS: Record<Lang, { language: string; title: string; description: string }> = {
  bn: {
    language: "bn-BD",
    title: `${siteConfig.nameBn} — নোটিশ বোর্ড`,
    description: siteConfig.taglineBn,
  },
  en: {
    language: "en",
    title: `${siteConfig.nameEn} — Notice Board`,
    description: siteConfig.taglineEn,
  },
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(date: Date): string {
  return date.toUTCString();
}

interface FeedNotice {
  slug: string;
  titleBn: string;
  titleEn: string;
  excerptBn: string;
  excerptEn: string;
  category: string;
  publishedAt: Date;
}

async function fetchNotices(): Promise<FeedNotice[]> {
  return db.notice.findMany({
    // Same visibility rule as the board and /notices/[slug]: unpublished and
    // future-dated notices are indistinguishable from missing ones.
    where: { isPublished: true, publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: {
      slug: true,
      titleBn: true,
      titleEn: true,
      excerptBn: true,
      excerptEn: true,
      category: true,
      publishedAt: true,
    },
  });
}

/**
 * GET /feed.xml — RSS 2.0 feed of the latest notices (default Bangla).
 * `?lang=en` serves the English variant: EN titles/excerpts, /en permalinks
 * and channel metadata. Every notice item links to its canonical
 * `/notices/[slug]` permalink and carries it as a permanent `<guid>`.
 */
export async function GET(request: Request): Promise<Response> {
  const requestedLang = new URL(request.url).searchParams.get("lang") ?? "bn";
  const lang: Lang = isLang(requestedLang) ? requestedLang : "bn";
  const channel = FEED_CHANNELS[lang];

  let notices: FeedNotice[] = [];
  try {
    notices = await fetchNotices();
  } catch {
    notices = [];
  }

  const items = notices
    .map((notice) => {
      // Round-6 notice permalinks — one real URL per language.
      const permalink = `${SITE_URL}${langPath(lang, `/notices/${notice.slug}`)}`;
      const title = lang === "bn" ? notice.titleBn : notice.titleEn || notice.titleBn;
      const description =
        lang === "bn"
          ? notice.excerptBn || notice.excerptEn
          : notice.excerptEn || notice.excerptBn;
      return [
        "    <item>",
        `      <title>${escapeXml(title)}</title>`,
        `      <link>${escapeXml(permalink)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(permalink)}</guid>`,
        `      <pubDate>${toRfc822(notice.publishedAt)}</pubDate>`,
        `      <category>${escapeXml(notice.category)}</category>`,
        `      <description>${escapeXml(description)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const lastBuildDate =
    notices.length > 0 ? toRfc822(notices[0].publishedAt) : toRfc822(new Date());
  const selfHref = lang === "en" ? `${SITE_URL}/feed.xml?lang=en` : `${SITE_URL}/feed.xml`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${escapeXml(`${SITE_URL}${langPath(lang, "/notices")}`)}</link>
    <description>${escapeXml(channel.description)}</description>
    <language>${escapeXml(channel.language)}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(selfHref)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=1800",
    },
  });
}
