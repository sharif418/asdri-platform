import { db } from "@/lib/db";
import { siteConfig } from "@/content/site";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://assunnahinstitute.org";
const FEED_TITLE = `${siteConfig.nameBn} — নোটিশ বোর্ড`;

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

/** GET /feed.xml — RSS 2.0 feed of the latest notices. */
export async function GET(): Promise<Response> {
  let notices: FeedNotice[] = [];
  try {
    notices = await fetchNotices();
  } catch {
    notices = [];
  }

  const items = notices
    .map((notice) => {
      const link = `${SITE_URL}/notices?notice=${encodeURIComponent(notice.slug)}`;
      const description = notice.excerptBn || notice.excerptEn;
      return [
        "    <item>",
        `      <title>${escapeXml(notice.titleBn)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="false">${escapeXml(notice.slug)}</guid>`,
        `      <pubDate>${toRfc822(notice.publishedAt)}</pubDate>`,
        `      <category>${escapeXml(notice.category)}</category>`,
        `      <description>${escapeXml(description)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const lastBuildDate =
    notices.length > 0 ? toRfc822(notices[0].publishedAt) : toRfc822(new Date());

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}/notices</link>
    <description>${escapeXml(siteConfig.taglineBn)}</description>
    <language>bn</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
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
