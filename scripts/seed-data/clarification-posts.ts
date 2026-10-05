import { clarificationArticles } from "@/content/blog";
import type { PrismaClient } from "@prisma/client";

type Db = PrismaClient;

/**
 * Clarification-track articles → kind-ARTICLE posts attached to their
 * `clar-<topicId>` PostCategory (created by seedContent's clarification
 * loop — run this AFTER seedContent). Idempotent: upsert by slug.
 *
 * The generic blog loop in content.ts derives categories from editorial
 * labels, which would never produce `clar-*` slugs — hence this dedicated
 * pass with an explicit slug → topic map.
 */
const TOPIC_BY_SLUG: Record<string, string> = {
  "allah-existence-rational-foundations": "atheism",
  "secularism-europe-experience-muslim-society": "secularism",
  "orientalist-islam-studies-western-aggression": "orientalism",
  "islam-science-conflict-myth": "scientism",
  "feminist-fitnah-ideology-and-reality": "feminism",
  "gender-theory-islamic-position": "lgbtq-gender",
};

export async function seedClarificationPosts(db: Db): Promise<void> {
  for (const article of clarificationArticles) {
    const topicId = TOPIC_BY_SLUG[article.slug];
    if (!topicId) {
      console.warn(`  ! clarification article without topic mapping skipped (${article.slug})`);
      continue;
    }
    const category = await db.postCategory.findUnique({ where: { slug: `clar-${topicId}` } });
    if (!category) {
      console.warn(`  ! clar-${topicId} category missing — run seedContent first (${article.slug})`);
      continue;
    }
    const authorPerson = await db.person.findFirst({
      where: { OR: [{ nameBn: article.author }, { nameEn: article.author }] },
      select: { id: true },
    });
    const data = {
      titleBn: article.title.bn,
      titleEn: article.title.en,
      excerptBn: article.excerpt.bn,
      excerptEn: article.excerpt.en,
      bodyBn: article.contentBn,
      bodyEn: article.contentEn ?? "",
      readingMinutes: article.readMinutes,
      publishedAt: new Date(article.publishedAt),
      isPublished: true,
      categoryId: category.id,
      authorId: authorPerson?.id ?? null,
      views: Math.floor(Math.random() * 900) + 120,
    };
    await db.post.upsert({
      where: { slug: article.slug },
      update: data,
      create: { slug: article.slug, kind: "ARTICLE", ...data },
    });
  }
  console.log(`  ✓ ${clarificationArticles.length} clarification articles`);
}
