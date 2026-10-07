/**
 * One-off data fix (round 4, M10 root cause behind H1): the original seed
 * stored YouTube *search* URLs (300+ percent-encoded chars) in
 * Video.youtubeId. Those rows broke edits (PATCH 400 — not a watch/ID form),
 * overflowed the admin list ~9× on phones and sent public visitors to a
 * search page. This script rewrites them to proper watch URLs using
 * clearly-placeholder 11-char IDs (ASDRI000001…), matching the fixed seed
 * data in src/content/media.ts.
 *
 * Idempotent: rows whose youtubeId is already a watch URL or a bare ID are
 * skipped, so re-running is a no-op.
 *
 *   cd /home/z/asdri-platform && DATABASE_URL="postgresql://asdri@127.0.0.1:5433/asdri_dev?schema=public" \
 *     bun scripts/fixtures/fix-video-urls.ts
 */
import { db } from "@/lib/db";

const SEARCH_PREFIX = "https://www.youtube.com/results";

/** Placeholder watch URL for slot n (ASDRI + 6 digits = 11-char video id). */
function watchUrl(n: number): string {
  return `https://www.youtube.com/watch?v=ASDRI${String(n).padStart(6, "0")}`;
}

/** Slot per known seeded title (titleBn → n) — mirrors src/content/media.ts. */
const TITLE_TO_SLOT: Record<string, number> = {
  "সংক্ষিপ্ত সংশয় নিরসন: আল্লাহ দেখা যায় না, তাহলে আছেন কীভাবে?": 1,
  "সায়েন্টিজম বনাম বিজ্ঞান: ৫ মিনিটে মূল পার্থক্য": 2,
  "পডকাস্ট: গবেষণা পদ্ধতিতে মুসলিম ঐতিহ্য — ড. মোস্তাফা মনজুর": 3,
  "লেকচার: নবীদের দাওয়াতি পদ্ধতি — শিক্ষণীয় দিকগুলো": 4,
  "সেমিনার রেকর্ডিং: সমকালীন চিন্তার চ্যালেঞ্জ ও দাওয়াহ": 5,
  "পডকাস্ট: মাঠে নামা দাঈরা — ফিল্ডওয়ার্ক অভিজ্ঞতা": 6,
};

async function main(): Promise<void> {
  const rows = await db.video.findMany({
    orderBy: [{ playlistKey: "asc" }, { sortOrder: "asc" }],
    select: { id: true, titleBn: true, youtubeId: true },
  });

  /** Slots already taken by rows the script (or an admin) fixed earlier. */
  const takenSlots = new Set<number>();
  for (const row of rows) {
    const match = /ASDRI(\d{6})/.exec(row.youtubeId);
    if (match && !row.youtubeId.startsWith(SEARCH_PREFIX)) takenSlots.add(Number(match[1]));
  }

  let fixed = 0;
  let skipped = 0;
  let nextSlot = 1;
  const nextFreeSlot = (): number => {
    while (takenSlots.has(nextSlot)) nextSlot += 1;
    takenSlots.add(nextSlot);
    return nextSlot;
  };

  for (const row of rows) {
    if (!row.youtubeId.startsWith(SEARCH_PREFIX)) {
      skipped += 1;
      continue; // already a watch URL / bare ID — nothing to do
    }
    const mapped = TITLE_TO_SLOT[row.titleBn];
    const slot = mapped !== undefined && !takenSlots.has(mapped) ? (takenSlots.add(mapped), mapped) : nextFreeSlot();
    await db.video.update({ where: { id: row.id }, data: { youtubeId: watchUrl(slot) } });
    fixed += 1;
    console.log(`fixed: ${row.titleBn} → ${watchUrl(slot)}`);
  }

  console.log(`\nvideos: ${rows.length} total · ${fixed} rewritten · ${skipped} already valid`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
