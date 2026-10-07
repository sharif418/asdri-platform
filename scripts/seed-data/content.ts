import { blogArticles } from "@/content/blog";
import { videos, galleryPhotos, newsItems } from "@/content/media";
import { researchProjects, callForPapers, publications, clarificationTopics, downloadItems } from "@/content/research";
import type { LocalizedText } from "@/types";
import type { Prisma, PrismaClient } from "@prisma/client";

import { NOTICE_SEEDS, FATWA_CATEGORIES, FATWA_SEEDS, FUND_SEEDS, CAMPAIGN_SEEDS } from "./content-data";
import { mdToHtml } from "./markdown";

type Db = PrismaClient;

function mdParagraphsToHtml(body: LocalizedText[] | readonly LocalizedText[]): { bn: string; en: string } {
  return {
    bn: body.map((p) => `<p>${p.bn}</p>`).join("\n"),
    en: body.map((p) => `<p>${p.en}</p>`).join("\n"),
  };
}

export async function seedContent(db: Db): Promise<void> {
  // notices
  for (const notice of NOTICE_SEEDS) {
    await db.notice.upsert({ where: { slug: notice.slug }, update: notice, create: notice });
  }

  // fatwa categories + entries
  for (const cat of FATWA_CATEGORIES) {
    await db.fatwaCategory.upsert({
      where: { key: cat.key },
      update: cat,
      create: cat,
    });
  }
  for (const { categoryKey, ...fatwa } of FATWA_SEEDS) {
    await db.fatwaEntry.upsert({
      where: { slug: fatwa.slug },
      update: { ...fatwa, category: { connect: { key: categoryKey } } },
      create: { ...fatwa, isPublished: true, category: { connect: { key: categoryKey } } },
    });
  }

  // blog: categories from article category labels
  const categoryKeys = new Map<string, string>();
  const seenCategories = new Set<string>();
  for (const article of blogArticles) {
    const catKey = article.category.bn;
    if (seenCategories.has(catKey)) continue;
    seenCategories.add(catKey);
    const slug = catKey.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "general";
    const row = await db.postCategory.upsert({
      where: { slug },
      update: { nameBn: article.category.bn, nameEn: article.category.en },
      create: { slug, nameBn: article.category.bn, nameEn: article.category.en, sortOrder: categoryKeys.size },
    });
    categoryKeys.set(catKey, row.id);
  }
  // authors → link by name to Person where possible
  for (let i = 0; i < blogArticles.length; i++) {
    const article = blogArticles[i];
    const authorPerson = await db.person.findFirst({
      where: { OR: [{ nameBn: article.author }, { nameEn: article.author }] },
      select: { id: true },
    });
    const data = {
      titleBn: article.title.bn,
      titleEn: article.title.en,
      excerptBn: article.excerpt.bn,
      excerptEn: article.excerpt.en,
      bodyBn: mdToHtml(article.contentBn),
      bodyEn: mdToHtml(article.contentEn ?? ""),
      readingMinutes: article.readMinutes,
      publishedAt: new Date(article.publishedAt),
      isPublished: true,
      categoryId: categoryKeys.get(article.category.bn) ?? null,
      authorId: authorPerson?.id ?? null,
      views: Math.floor(Math.random() * 900) + 120,
    };
    await db.post.upsert({
      where: { slug: article.slug },
      update: data,
      create: { slug: article.slug, kind: "ARTICLE", ...data },
    });
  }

  // clarifications → posts with kind CLARIFICATION (topics as categories)
  for (let i = 0; i < clarificationTopics.length; i++) {
    const topic = clarificationTopics[i] as unknown as { id: string; title: LocalizedText; description: LocalizedText; articleCount: number; videoCount: number };
    const catSlug = `clar-${topic.id}`;
    const cat = await db.postCategory.upsert({
      where: { slug: catSlug },
      update: { nameBn: topic.title.bn, nameEn: topic.title.en },
      create: { slug: catSlug, nameBn: topic.title.bn, nameEn: topic.title.en, sortOrder: 50 + i },
    });
    await db.siteSetting.upsert({
      where: { key: `clarification.topic.${topic.id}` },
      update: { value: { descriptionBn: topic.description.bn, descriptionEn: topic.description.en, articleCount: topic.articleCount, videoCount: topic.videoCount } as Prisma.InputJsonValue },
      create: { key: `clarification.topic.${topic.id}`, value: { descriptionBn: topic.description.bn, descriptionEn: topic.description.en, articleCount: topic.articleCount, videoCount: topic.videoCount } as Prisma.InputJsonValue },
    });
    void cat;
  }

  // news → posts with kind NEWS
  for (const item of newsItems) {
    const body = mdParagraphsToHtml(item.body);
    await db.post.upsert({
      where: { slug: item.id },
      update: { titleBn: item.title.bn, titleEn: item.title.en, excerptBn: item.excerpt.bn, excerptEn: item.excerpt.en, bodyBn: body.bn, bodyEn: body.en, publishedAt: new Date(item.date), isPublished: true, kind: "NEWS" },
      create: { slug: item.id, titleBn: item.title.bn, titleEn: item.title.en, excerptBn: item.excerpt.bn, excerptEn: item.excerpt.en, bodyBn: body.bn, bodyEn: body.en, publishedAt: new Date(item.date), isPublished: true, kind: "NEWS" },
    });
  }

  // videos
  await db.video.deleteMany({});
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    // Canonical form: the 11-char ID extracted from a watch URL (placeholder
    // ASDRI0000xx IDs in the seed data — clearly fake, but valid form so
    // edits/thumbnails/links work until real IDs are pasted in).
    const youtubeId = video.youtubeUrl.includes("watch?v=")
      ? video.youtubeUrl.split("watch?v=")[1]?.split("&")[0] ?? video.youtubeUrl
      : video.youtubeUrl;
    await db.video.create({
      data: {
        titleBn: video.title.bn,
        titleEn: video.title.en,
        descriptionBn: video.playlist.bn,
        descriptionEn: video.playlist.en,
        youtubeId,
        playlistKey: video.playlist.bn,
        sortOrder: i,
        isPublished: true,
      },
    });
  }

  // publications
  for (let i = 0; i < publications.length; i++) {
    const pub = publications[i] as unknown as { id: string; title: LocalizedText; author: string; authorRole: LocalizedText; type: string; year: number; description: LocalizedText; issnIsbn: string | null };
    const kindMap: Record<string, "JOURNAL" | "BOOK" | "PAPER" | "MAGAZINE" | "BULLETIN"> = {
      journal: "JOURNAL",
      book: "BOOK",
      paper: "PAPER",
    };
    await db.publication.upsert({
      where: { slug: pub.id },
      update: {
        titleBn: pub.title.bn,
        titleEn: pub.title.en,
        abstractBn: pub.description.bn,
        abstractEn: pub.description.en,
        authorsBn: `${pub.author} — ${pub.authorRole.bn}`,
        authorsEn: `${pub.author} — ${pub.authorRole.en}`,
        kind: kindMap[pub.type] ?? "PAPER",
        year: pub.year,
        issn: pub.issnIsbn,
        isbn: null,
        sortOrder: i,
      },
      create: {
        slug: pub.id,
        titleBn: pub.title.bn,
        titleEn: pub.title.en,
        abstractBn: pub.description.bn,
        abstractEn: pub.description.en,
        authorsBn: `${pub.author} — ${pub.authorRole.bn}`,
        authorsEn: `${pub.author} — ${pub.authorRole.en}`,
        kind: kindMap[pub.type] ?? "PAPER",
        year: pub.year,
        issn: pub.issnIsbn,
        isbn: null,
        sortOrder: i,
        isPublished: true,
      },
    });
  }

  // research projects
  for (let i = 0; i < researchProjects.length; i++) {
    const project = researchProjects[i] as unknown as { id: string; title: LocalizedText; description: LocalizedText; progress: number; status: string; team: LocalizedText | null };
    await db.researchProject.upsert({
      where: { slug: project.id },
      update: {
        titleBn: project.title.bn,
        titleEn: project.title.en,
        summaryBn: project.description.bn,
        summaryEn: project.description.en,
        progress: project.progress,
        statusBn: project.status === "ongoing" ? "চলমান" : "আসন্ন",
        statusEn: project.status === "ongoing" ? "Ongoing" : "Upcoming",
        sortOrder: i,
      },
      create: {
        slug: project.id,
        titleBn: project.title.bn,
        titleEn: project.title.en,
        summaryBn: project.description.bn,
        summaryEn: project.description.en,
        progress: project.progress,
        statusBn: project.status === "ongoing" ? "চলমান" : "আসন্ন",
        statusEn: project.status === "ongoing" ? "Ongoing" : "Upcoming",
        sortOrder: i,
        isPublished: true,
      },
    });
  }
  // call-for-papers → settings (guidelines list + deadline)
  const cfpValue = {
    active: callForPapers.active,
    titleBn: callForPapers.title.bn,
    titleEn: callForPapers.title.en,
    deadline: callForPapers.deadline,
    guidelines: callForPapers.guidelines.map((g) => ({ bn: g.bn, en: g.en })),
  } as Prisma.InputJsonValue;
  await db.siteSetting.upsert({
    where: { key: "research.callForPapers" },
    update: { value: cfpValue },
    create: { key: "research.callForPapers", value: cfpValue },
  });

  // downloads (metadata only — the office attaches real files from the admin;
  // round-1 static /downloads/*.pdf paths keep working until replaced)
  const CATEGORY_LABELS: Record<string, { bn: string; en: string }> = {
    prospectus: { bn: "প্রসপেক্টাস", en: "Prospectus" },
    syllabus: { bn: "সিলেবাস ও কারিকুলাম", en: "Syllabus & Curriculum" },
    form: { bn: "ফরম ও আবেদনপত্র", en: "Forms & Applications" },
    dawah: { bn: "দাওয়াহ ম্যাটেরিয়ালস", en: "Dawah Materials" },
  };
  for (let i = 0; i < downloadItems.length; i++) {
    const item = downloadItems[i] as unknown as { id: string; title: LocalizedText; description: LocalizedText; category: string; fileType: string; sizeLabel: string; url: string };
    const existing = await db.downloadResource.findFirst({ where: { titleBn: item.title.bn } });
    const data = {
      titleBn: item.title.bn,
      titleEn: item.title.en,
      descriptionBn: item.description?.bn ?? `${item.fileType} · ${item.sizeLabel}`,
      descriptionEn: item.description?.en ?? `${item.fileType} · ${item.sizeLabel}`,
      categoryBn: CATEGORY_LABELS[item.category]?.bn ?? item.category,
      categoryEn: CATEGORY_LABELS[item.category]?.en ?? item.category,
      sortOrder: i,
      isPublished: true,
    };
    if (existing) {
      await db.downloadResource.update({ where: { id: existing.id }, data });
    } else {
      await db.downloadResource.create({ data });
    }
  }

  // funds + campaigns
  for (const fund of FUND_SEEDS) {
    await db.fund.upsert({ where: { key: fund.key }, update: fund, create: { ...fund, isEnabled: true } });
  }
  for (const { fundKey, ...campaign } of CAMPAIGN_SEEDS) {
    await db.campaign.upsert({
      where: { slug: campaign.slug },
      update: { ...campaign, fund: { connect: { key: fundKey } } },
      create: { ...campaign, isPublished: true, fund: { connect: { key: fundKey } } },
    });
  }

  console.log(
    `  ✓ ${NOTICE_SEEDS.length} notices, ${FATWA_SEEDS.length} fatwa entries, ${blogArticles.length} articles, ${newsItems.length} news, ${videos.length} videos, ${publications.length} publications, ${researchProjects.length} projects, ${FUND_SEEDS.length} funds, ${CAMPAIGN_SEEDS.length} campaigns`,
  );
}
