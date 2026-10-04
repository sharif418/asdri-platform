import { db } from "@/lib/db";
import { rotateFallback, splitParagraphs } from "@/lib/content/html";
import type { GalleryPhoto, LocalizedText, NewsItem, VideoItem } from "@/types";

/**
 * DB → view-model adapters for the media pages: videos (Video table), photo
 * gallery (Album + AlbumImage, flattened to the GalleryPhoto list the gallery
 * explorer consumes) and news/events (Post where kind = NEWS).
 */

/** Placeholder thumbnails for videos without a poster frame in storage. */
const VIDEO_THUMBS = [
  "/images/blog-science.png",
  "/images/blog-atheism.png",
  "/images/study-circle.png",
  "/images/campus-mosque.png",
  "/images/campus-seminar.png",
  "/images/campus-fieldwork.png",
] as const;

/** Fallback covers for news posts without uploaded cover media. */
const NEWS_COVERS = [
  "/images/news-agreement.png",
  "/images/azan-training.png",
  "/images/campus-graduation.png",
  "/images/campus-library.png",
] as const;

/** YouTube deep link: a bare ID becomes a watch URL, full URLs pass through. */
function toYoutubeUrl(youtubeIdOrUrl: string): string {
  const value = youtubeIdOrUrl.trim();
  if (!value) return "https://www.youtube.com/@AsSunnahFoundation";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[\w-]{11}$/.test(value)) return `https://www.youtube.com/watch?v=${value}`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(value)}`;
}

/** Videos & podcasts, ordered by sortOrder; playlist label from the row. */
export async function getVideos(): Promise<VideoItem[]> {
  const rows = await db.video.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      titleBn: true,
      titleEn: true,
      descriptionBn: true,
      descriptionEn: true,
      youtubeId: true,
      playlistKey: true,
      sortOrder: true,
    },
  });
  return rows.map((row, index) => ({
    id: row.id,
    title: { bn: row.titleBn, en: row.titleEn || row.titleBn },
    // The seed stores the playlist label in descriptionBn/En; playlistKey is
    // the Bangla label — fall back to it when descriptions are empty.
    playlist: {
      bn: row.descriptionBn || row.playlistKey,
      en: row.descriptionEn || row.descriptionBn || row.playlistKey,
    },
    duration: "",
    thumbnail: rotateFallback(VIDEO_THUMBS, index),
    youtubeUrl: toYoutubeUrl(row.youtubeId),
  }));
}

/** Flat photo list grouped by album label (the explorer groups client-side). */
export async function getAlbums(): Promise<GalleryPhoto[]> {
  const albums = await db.album.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    select: {
      titleBn: true,
      titleEn: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: {
          captionBn: true,
          captionEn: true,
          media: { select: { key: true, altBn: true, altEn: true } },
        },
      },
    },
  });
  const photos: GalleryPhoto[] = [];
  for (const album of albums) {
    const albumLabel: LocalizedText = { bn: album.titleBn, en: album.titleEn || album.titleBn };
    for (const image of album.images) {
      const caption: LocalizedText = { bn: image.captionBn, en: image.captionEn || image.captionBn };
      photos.push({
        src: `/api/media/${image.media.key}`,
        alt: {
          bn: image.media.altBn || caption.bn || album.titleBn,
          en: image.media.altEn || caption.en || image.media.altBn || album.titleEn,
        },
        caption,
        album: albumLabel,
      });
    }
  }
  return photos;
}

/** News & events feed (Post kind = NEWS); future dates count as upcoming. */
export async function getNewsItems(): Promise<NewsItem[]> {
  const rows = await db.post.findMany({
    where: { kind: "NEWS", isPublished: true },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      titleBn: true,
      titleEn: true,
      excerptBn: true,
      excerptEn: true,
      bodyBn: true,
      bodyEn: true,
      publishedAt: true,
      coverMedia: { select: { key: true } },
    },
  });
  const now = Date.now();
  return rows.map((row, index) => {
    const publishedMs = row.publishedAt ? row.publishedAt.getTime() : 0;
    return {
      id: row.slug,
      title: { bn: row.titleBn, en: row.titleEn || row.titleBn },
      excerpt: { bn: row.excerptBn, en: row.excerptEn || row.excerptBn },
      date: row.publishedAt ? row.publishedAt.toISOString() : new Date(0).toISOString(),
      location: null,
      cover: row.coverMedia ? `/api/media/${row.coverMedia.key}` : rotateFallback(NEWS_COVERS, index),
      body: splitParagraphs(row.bodyBn, row.bodyEn),
      upcoming: publishedMs > now,
    };
  });
}
