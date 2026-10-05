import { db } from "@/lib/db";
import { readSetting } from "@/lib/settings";
import { clarificationTopics as staticTopics, downloadItems as staticDownloads } from "@/content/research";
import type { ClarificationTopic, DownloadItem, PublicationItem, ResearchProject } from "@/types";

/**
 * DB → view-model adapters for the research section: projects, publications,
 * clarification topics (settings + PostCategory), the call-for-papers banner
 * and the download center. Titles/icons absent from the DB fall back to the
 * static seed module (src/content/research.ts stays as the seed source).
 */

const PUBLICATION_ACCENTS = [
  "from-emerald-700 to-emerald-900",
  "from-amber-600 to-amber-800",
  "from-teal-700 to-emerald-900",
  "from-emerald-800 to-teal-900",
  "from-amber-700 to-emerald-900",
  "from-teal-600 to-emerald-800",
] as const;

/** topicId → icon key (the DB has no icon column; the seed's set is fixed). */
const TOPIC_ICONS: Record<string, string> = {
  scientism: "flask-conical",
  secularism: "landmark",
  atheism: "help-circle",
  feminism: "venus",
  orientalism: "globe",
  "lgbtq-gender": "shield-alert",
};

type PublicationKindValue = "JOURNAL" | "MAGAZINE" | "BULLETIN" | "BOOK" | "PAPER";

function publicationType(kind: PublicationKindValue): PublicationItem["type"] {
  switch (kind) {
    case "BOOK":
      return "book";
    case "PAPER":
      return "paper";
    default:
      return "journal";
  }
}

/** Ongoing & upcoming research projects. */
export async function getResearchProjects(): Promise<ResearchProject[]> {
  const rows = await db.researchProject.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    select: {
      slug: true,
      titleBn: true,
      titleEn: true,
      summaryBn: true,
      summaryEn: true,
      progress: true,
      statusBn: true,
      statusEn: true,
    },
  });
  return rows.map((row) => {
    const statusEn = row.statusEn.trim().toLowerCase();
    return {
      id: row.slug,
      title: { bn: row.titleBn, en: row.titleEn || row.titleBn },
      description: { bn: row.summaryBn, en: row.summaryEn || row.summaryBn },
      progress: Math.min(100, Math.max(0, row.progress)),
      status: statusEn.startsWith("upcom") ? "upcoming" : "ongoing",
      team: null,
    };
  });
}

/** Library journals & faculty publications. */
export async function getPublications(): Promise<PublicationItem[]> {
  const rows = await db.publication.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    select: {
      slug: true,
      titleBn: true,
      titleEn: true,
      abstractBn: true,
      abstractEn: true,
      authorsBn: true,
      authorsEn: true,
      kind: true,
      year: true,
      isbn: true,
      issn: true,
    },
  });
  return rows.map((row, index) => {
    const [authorBn = "", roleBn = ""] = row.authorsBn.split("—").map((s) => s.trim());
    const [authorEn = "", roleEn = ""] = (row.authorsEn || row.authorsBn).split("—").map((s) => s.trim());
    return {
      id: row.slug,
      title: { bn: row.titleBn, en: row.titleEn || row.titleBn },
      author: authorBn || authorEn,
      authorRole: { bn: roleBn || "গবেষণা বোর্ড", en: roleEn || roleBn || "Research Board" },
      type: publicationType(row.kind),
      year: row.year,
      description: { bn: row.abstractBn, en: row.abstractEn || row.abstractBn },
      issnIsbn: row.isbn ?? row.issn ?? null,
      accentClass: PUBLICATION_ACCENTS[index % PUBLICATION_ACCENTS.length],
    };
  });
}

/** সংশয় নিরসন topics — settings hold descriptions/video counts, PostCategory
 *  the titles; article counts come from the DB (published ARTICLE posts in
 *  each clar-* category), never from the seeded static numbers. */
export async function getClarificationTopics(): Promise<ClarificationTopic[]> {
  const [settingRows, categoryRows] = await Promise.all([
    db.siteSetting.findMany({ where: { key: { startsWith: "clarification.topic." } }, select: { key: true, value: true } }),
    db.postCategory.findMany({
      where: { slug: { startsWith: "clar-" } },
      orderBy: { sortOrder: "asc" },
      select: {
        slug: true,
        nameBn: true,
        nameEn: true,
        _count: { select: { posts: { where: { kind: "ARTICLE", isPublished: true } } } },
      },
    }),
  ]);

  const byId = new Map<string, { descriptionBn: string; descriptionEn: string; videoCount: number }>();
  for (const setting of settingRows) {
    const value = setting.value as {
      descriptionBn?: string;
      descriptionEn?: string;
      videoCount?: number;
    };
    byId.set(setting.key.replace("clarification.topic.", ""), {
      descriptionBn: value.descriptionBn ?? "",
      descriptionEn: value.descriptionEn ?? "",
      videoCount: value.videoCount ?? 0,
    });
  }

  const topics: ClarificationTopic[] = [];
  for (const category of categoryRows) {
    const id = category.slug.replace("clar-", "");
    const setting = byId.get(id);
    const fallback = staticTopics.find((topic) => topic.id === id);
    topics.push({
      id,
      title: {
        bn: category.nameBn || fallback?.title.bn || id,
        en: category.nameEn || fallback?.title.en || category.nameBn || id,
      },
      description: {
        bn: setting?.descriptionBn || fallback?.description.bn || "",
        en: setting?.descriptionEn || fallback?.description.en || setting?.descriptionBn || "",
      },
      articleCount: category._count.posts,
      videoCount: setting?.videoCount ?? fallback?.videoCount ?? 0,
      icon: TOPIC_ICONS[id] ?? fallback?.icon ?? "help-circle",
    });
  }
  // Any setting without a matching PostCategory (title fallback to static);
  // no category exists to hold posts, so the article count is honestly 0.
  for (const [id, setting] of byId) {
    if (topics.some((topic) => topic.id === id)) continue;
    const fallback = staticTopics.find((topic) => topic.id === id);
    topics.push({
      id,
      title: { bn: fallback?.title.bn ?? id, en: fallback?.title.en ?? id },
      description: { bn: setting.descriptionBn, en: setting.descriptionEn || setting.descriptionBn },
      articleCount: 0,
      videoCount: setting.videoCount,
      icon: TOPIC_ICONS[id] ?? fallback?.icon ?? "help-circle",
    });
  }
  return topics;
}

interface CallForPapersValue {
  active?: boolean;
  titleBn?: string;
  titleEn?: string;
  deadline?: string;
  guidelines?: { bn: string; en: string }[];
}

/** Call-for-papers banner data (research.callForPapers setting). */
export async function getCallForPapers(): Promise<{
  active: boolean;
  title: { bn: string; en: string };
  deadline: string;
  guidelines: { bn: string; en: string }[];
}> {
  const value = await readSetting<CallForPapersValue>("research.callForPapers", {
    active: false,
    titleBn: "",
    titleEn: "",
    deadline: "",
    guidelines: [],
  });
  return {
    active: value.active ?? false,
    title: { bn: value.titleBn ?? "", en: value.titleEn || value.titleBn || "" },
    deadline: value.deadline ?? "",
    guidelines: value.guidelines ?? [],
  };
}

const DOWNLOAD_CATEGORY_KEYWORDS: { category: DownloadItem["category"]; test: RegExp }[] = [
  { category: "prospectus", test: /prospectus|প্রসপেক্টাস|প্রস্যাক্টাস/i },
  { category: "syllabus", test: /syllabus|curriculum|সিলেবাস/i },
  { category: "form", test: /form|application|ফরম|আবেদন/i },
  { category: "dawah", test: /dawah|leaflet|poster|দাওয়াহ/i },
];

function downloadCategory(row: { titleBn: string; titleEn: string; categoryBn: string; categoryEn: string }, staticMatch: DownloadItem | undefined): DownloadItem["category"] {
  if (staticMatch) return staticMatch.category;
  const haystack = `${row.categoryEn} ${row.categoryBn} ${row.titleEn} ${row.titleBn}`;
  return DOWNLOAD_CATEGORY_KEYWORDS.find((entry) => entry.test.test(haystack))?.category ?? "syllabus";
}

/** Download center resources; file URLs fall back to the static seed by title. */
export async function getDownloadItems(): Promise<DownloadItem[]> {
  const rows = await db.downloadResource.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      titleBn: true,
      titleEn: true,
      descriptionBn: true,
      descriptionEn: true,
      categoryBn: true,
      categoryEn: true,
      fileMedia: { select: { key: true } },
    },
  });
  return rows.map((row) => {
    const staticMatch = staticDownloads.find(
      (item) => item.title.bn === row.titleBn || item.title.en === row.titleEn,
    );
    return {
      id: row.id,
      title: { bn: row.titleBn, en: row.titleEn || row.titleBn },
      category: downloadCategory(row, staticMatch),
      fileType: staticMatch?.fileType ?? "PDF",
      sizeLabel: staticMatch?.sizeLabel ?? "—",
      url: row.fileMedia ? `/api/media/${row.fileMedia.key}` : staticMatch?.url ?? null,
    };
  });
}
