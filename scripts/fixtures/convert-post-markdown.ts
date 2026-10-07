/**
 * One-off data fix (round 4, M9): 11 of 15 seeded posts stored literal
 * markdown ("## শিরোনাম") in bodyBn/bodyEn because the original seed passed
 * the src/content/blog.ts bodies through unchanged. The admin RTE and the
 * public article page render HTML, so officers saw (and the site rendered)
 * literal "##" prefixes inside the flagship articles.
 *
 * Rewrites every post whose body still looks like that markdown (starts
 * with "## " or contains a newline followed by "## ") using the same
 * converter the fixed seed uses (scripts/seed-data/markdown.ts). Idempotent:
 * HTML bodies never match, so re-running is a no-op.
 *
 *   cd /home/z/asdri-platform && DATABASE_URL="postgresql://asdri@127.0.0.1:5433/asdri_dev?schema=public" \
 *     bun scripts/fixtures/convert-post-markdown.ts
 */
import { db } from "@/lib/db";
import { mdToHtml } from "../seed-data/markdown";

/** Markdown-shaped body: leading "## " heading or one after a newline. */
const MARKDOWN_BODY = /^## |\n## /;

async function main(): Promise<void> {
  const posts = await db.post.findMany({ select: { id: true, slug: true, bodyBn: true, bodyEn: true } });
  let converted = 0;
  for (const post of posts) {
    const bodyBn = MARKDOWN_BODY.test(post.bodyBn) ? mdToHtml(post.bodyBn) : post.bodyBn;
    const bodyEn = MARKDOWN_BODY.test(post.bodyEn) ? mdToHtml(post.bodyEn) : post.bodyEn;
    if (bodyBn === post.bodyBn && bodyEn === post.bodyEn) continue;
    await db.post.update({ where: { id: post.id }, data: { bodyBn, bodyEn } });
    converted += 1;
    console.log(`  ✓ converted ${post.slug}`);
  }
  console.log(converted === 0 ? "  ✓ nothing to do — no markdown post bodies" : `  ✓ ${converted} post(s) converted`);

  const remaining = await db.post.count({ where: { OR: [{ bodyBn: { startsWith: "## " } }, { bodyBn: { contains: "\n## " } }] } });
  console.log(remaining === 0 ? "  ✓ verified: no post body still starts with '## '" : `  ! ${remaining} post body(ies) still markdown`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void db.$disconnect());
