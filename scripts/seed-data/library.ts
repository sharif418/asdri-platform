import type { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { publications } from "@/content/research";

type Db = PrismaClient;

/**
 * Round-4 library seed — the online catalogue's opening shelf:
 *
 *   - the seeded journal Publications (kind JOURNAL) become JOURNAL_ISSUE
 *     items, keeping any attached PDF Media (fileMediaId) — there are none in
 *     the current content, so the wiring matters more than the data;
 *   - the institute's own books & research papers from the same content list
 *     become BOOK / PAPER items (a couple of extra books adapted from the
 *     seeded faculty, so every category has a spine on it);
 *   - 4 categories, 3 publishers, creators upserted by name pair.
 *
 * Idempotent: everything upserts on its natural key (slug / name pair);
 * item→creator links are rebuilt per run (order-stable).
 */

interface CreatorSeed {
  nameBn: string;
  nameEn: string;
  role: "AUTHOR" | "EDITOR" | "TRANSLATOR";
}

interface CategorySeed {
  slug: string;
  nameBn: string;
  nameEn: string;
}

const CATEGORIES: CategorySeed[] = [
  { slug: "islamic-aqidah", nameBn: "ইসলামী আকীদা", nameEn: "Islamic Creed" },
  { slug: "hadith-sunnah", nameBn: "হাদীস ও সুন্নাহ", nameEn: "Hadith & Sunnah" },
  { slug: "fiqh-fatwa", nameBn: "ফিকহ ও ফতোয়া", nameEn: "Fiqh & Fatwa" },
  { slug: "research-journal", nameBn: "গবেষণা পত্রিকা", nameEn: "Research Journal" },
];

const PUBLISHERS: { nameBn: string; nameEn: string }[] = [
  { nameBn: "আস-সুন্নাহ ফাউন্ডেশন", nameEn: "As-Sunnah Foundation" },
  { nameBn: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট", nameEn: "As-Sunnah Dawah & Research Institute" },
  { nameBn: "দারুস সুন্নাহ প্রকাশনী", nameEn: "Darus Sunnah Publications" },
];

/** Books beyond the content list — adapted from the institute's faculty. */
const EXTRA_BOOKS: {
  type: "BOOK";
  slug: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  year: number;
  categorySlug: string;
  publisher: (typeof PUBLISHERS)[number];
  isbn: string | null;
  creators: CreatorSeed[];
}[] = [
  {
    type: "BOOK",
    slug: "hadith-foundations",
    titleBn: "হাদীসশাস্ত্রের ভিত্তি ও প্রামাণ্য",
    titleEn: "Foundations and Authority of Hadith Science",
    descriptionBn: "হাদীসের সনদ ও মতন, গ্রহণ-নির্ভরযোগ্যতার মানদণ্ড এবং সহীহ-দুর্বল নিরূপণের পদ্ধতি — প্রাথমিক পাঠকদের জন্য পদ্ধতিগত উপস্থাপনা।",
    descriptionEn: "Isnad and matn, the criteria of acceptance, and the method of grading hadith — a systematic primer for beginning students.",
    year: 2023,
    categorySlug: "hadith-sunnah",
    publisher: PUBLISHERS[2],
    isbn: null,
    creators: [{ nameBn: "মাওলানা লিয়াকত আলী", nameEn: "Mawlana Liaquat Ali", role: "AUTHOR" }],
  },
  {
    type: "BOOK",
    slug: "contemporary-fiqh-questions",
    titleBn: "সমকালীন ফিকহি জিজ্ঞাসা ও ফতোয়া",
    titleEn: "Contemporary Fiqh Questions and Fatwas",
    descriptionBn: "আধুনিক জীবনের নতুন সমস্যায় ইজতিহাদের পদ্ধতি ও ফতোয়ার নমুনা সংকলন — ব্যাংকিং, চিকিৎসা ও প্রযুক্তির ফিকহি বিশ্লেষণ।",
    descriptionEn: "A collection on ijtihad's method for modern problems, with sample fatwas — fiqh analysis of banking, medicine, and technology.",
    year: 2025,
    categorySlug: "fiqh-fatwa",
    publisher: PUBLISHERS[0],
    isbn: null,
    creators: [{ nameBn: "উস্তায সালাহুদ্দীন তারেক", nameEn: "Ustadh Salahuddin Tarek", role: "AUTHOR" }],
  },
  {
    type: "BOOK",
    slug: "tawhid-primer",
    titleBn: "তাওহীদের ভিত্তি: আকীদার প্রাথমিক পাঠ",
    titleEn: "Foundations of Tawhid: A Primer on Creed",
    descriptionBn: "আল্লাহর সত্তা ও গুণ, রিসালাত ও আখিরাতের বিশ্বাস — কুরআন-সুন্নাহর আলোকে সংক্ষিপ্ত পাঠ্য রচনা।",
    descriptionEn: "Allah's essence and attributes, prophethood and the hereafter — a concise text in the light of the Qur'an and Sunnah.",
    year: 2023,
    categorySlug: "islamic-aqidah",
    publisher: PUBLISHERS[2],
    isbn: null,
    creators: [{ nameBn: "উস্তায আরিফ বিল্লাহ", nameEn: "Ustadh Arif Billah", role: "AUTHOR" }],
  },
];

/** Books taken straight from the content list (institute's own publications). */
const CONTENT_BOOK_SLUGS = ["book-dai-personality", "book-history-civilization"];
const CONTENT_PAPER_SLUGS = ["paper-scientism", "paper-women-rights"];

/** Strip a redundant leading "ISSN "/"ISBN " the content stores inside the value. */
function cleanIdentifier(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/^\s*ISSN\s+/i, "").replace(/^\s*ISBN\s+/i, "").trim() || null;
}

function para(text: string): string {
  return text ? `<p>${text}</p>` : "";
}

async function upsertCreator(db: Db, creator: CreatorSeed): Promise<string> {
  const existing = await db.libraryCreator.findFirst({ where: { nameBn: creator.nameBn, nameEn: creator.nameEn }, select: { id: true } });
  if (existing) return existing.id;
  const row = await db.libraryCreator.create({ data: { nameBn: creator.nameBn, nameEn: creator.nameEn }, select: { id: true } });
  return row.id;
}

async function upsertPublisher(db: Db, publisher: { nameBn: string; nameEn: string }): Promise<string> {
  const existing = await db.libraryPublisher.findFirst({ where: { nameBn: publisher.nameBn, nameEn: publisher.nameEn }, select: { id: true } });
  if (existing) return existing.id;
  const row = await db.libraryPublisher.create({ data: { nameBn: publisher.nameBn, nameEn: publisher.nameEn }, select: { id: true } });
  return row.id;
}

interface ItemSeed {
  slug: string;
  type: "BOOK" | "JOURNAL_ISSUE" | "PAPER";
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  year: number;
  categorySlug: string;
  publisher: { nameBn: string; nameEn: string };
  issn?: string | null;
  mediaId?: string | null;
  coverMediaId?: string | null;
  volume?: string;
  issueLabel?: string;
  journalKey?: string;
  journalNameBn?: string;
  journalNameEn?: string;
  creators: CreatorSeed[];
}

/** Build the full item list: journals (from Publication rows), books, papers. */
async function buildItems(db: Db): Promise<ItemSeed[]> {
  const items: ItemSeed[] = [];

  // 1. Journal Publications → JOURNAL_ISSUE items (keep their PDF Media).
  // Each seeded journal keeps its own identity: the annual research issue and
  // the periodic bulletin are different periodicals → different journalKeys.
  const JOURNAL_IDENTITY: Record<string, { key: string; nameBn: string; nameEn: string; volume: string; issueLabel: string }> = {
    "journal-annual-vol1": { key: "as-sunnah-journal", nameBn: "আস-সুন্নাহ জার্নাল", nameEn: "As-Sunnah Journal", volume: "১", issueLabel: "১ম সংখ্যা" },
    "journal-bulletin": { key: "research-bulletin", nameBn: "গবেষণা বার্তা", nameEn: "Research Bulletin", volume: "১", issueLabel: "নিয়মিত সংখ্যা" },
  };
  const journalPublications = await db.publication.findMany({ where: { kind: "JOURNAL" }, orderBy: { sortOrder: "asc" } });
  for (const pub of journalPublications) {
    const identity = JOURNAL_IDENTITY[pub.slug] ?? { key: "as-sunnah-journal", nameBn: "আস-সুন্নাহ জার্নাল", nameEn: "As-Sunnah Journal", volume: "১", issueLabel: "১ম সংখ্যা" };
    items.push({
      slug: pub.slug,
      type: "JOURNAL_ISSUE",
      titleBn: pub.titleBn,
      titleEn: pub.titleEn,
      descriptionBn: para(pub.abstractBn),
      descriptionEn: para(pub.abstractEn),
      year: pub.year,
      categorySlug: "research-journal",
      publisher: PUBLISHERS[1],
      issn: cleanIdentifier(pub.issn),
      mediaId: pub.fileMediaId, // the seeded journals carry none — wiring ready for real PDFs
      coverMediaId: pub.coverMediaId,
      volume: identity.volume,
      issueLabel: identity.issueLabel,
      journalKey: identity.key,
      journalNameBn: identity.nameBn,
      journalNameEn: identity.nameEn,
      creators: [{ nameBn: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট", nameEn: "Research Board, As-Sunnah Institute", role: "EDITOR" }],
    });
  }

  // 2. Books & papers from the round-1 content list.
  const contentByKey = new Map(publications.map((pub) => [pub.id, pub]));
  for (const slug of [...CONTENT_BOOK_SLUGS, ...CONTENT_PAPER_SLUGS]) {
    const source = contentByKey.get(slug) as
      | { id: string; title: { bn: string; en: string }; author: string; type: string; year: number; description: { bn: string; en: string } }
      | undefined;
    if (!source) continue;
    const paper = CONTENT_PAPER_SLUGS.includes(slug);
    items.push({
      slug: source.id,
      type: paper ? "PAPER" : "BOOK",
      titleBn: source.title.bn,
      titleEn: source.title.en,
      descriptionBn: para(source.description.bn),
      descriptionEn: para(source.description.en),
      year: source.year,
      categorySlug: source.id === "paper-women-rights" ? "fiqh-fatwa" : source.id === "paper-scientism" ? "islamic-aqidah" : source.id === "book-history-civilization" ? "hadith-sunnah" : "islamic-aqidah",
      publisher: PUBLISHERS[paper ? 1 : 0],
      creators: [{ nameBn: source.author, nameEn: source.author, role: "AUTHOR" }],
    });
  }

  // 3. Extra faculty books so every category has shelf presence.
  items.push(...EXTRA_BOOKS);

  return items;
}

export async function seedLibrary(db: Db): Promise<void> {
  // categories (upsert by slug)
  for (let i = 0; i < CATEGORIES.length; i++) {
    const category = CATEGORIES[i];
    await db.libraryCategory.upsert({
      where: { slug: category.slug },
      update: { nameBn: category.nameBn, nameEn: category.nameEn, sortOrder: i },
      create: { ...category, sortOrder: i },
    });
  }
  const categoryBySlug = new Map(
    (await db.libraryCategory.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]),
  );

  // items (upsert by slug) + creator links (rebuilt per run).
  // mediaId/coverMediaId are NEVER part of the update half: a re-run must
  // not detach a PDF/cover a librarian attached through the admin.
  const items = await buildItems(db);
  for (const seed of items) {
    const data = {
      type: seed.type,
      titleBn: seed.titleBn,
      titleEn: seed.titleEn,
      descriptionBn: seed.descriptionBn,
      descriptionEn: seed.descriptionEn,
      language: "bn",
      categoryId: categoryBySlug.get(seed.categorySlug) ?? null,
      publisherId: await upsertPublisher(db, seed.publisher),
      publishYear: seed.year,
      issn: seed.issn ?? null,
      volume: seed.volume ?? "",
      issueLabel: seed.issueLabel ?? "",
      journalKey: seed.journalKey ?? "",
      journalNameBn: seed.journalNameBn ?? "",
      journalNameEn: seed.journalNameEn ?? "",
      mediaId: seed.mediaId ?? null,
      coverMediaId: seed.coverMediaId ?? null,
      visibility: "PUBLIC" as const,
      isPublished: true,
    };
    const { mediaId: _seedFile, ...updateData } = data;
    await db.libraryItem.upsert({
      where: { slug: seed.slug },
      update: updateData,
      create: { slug: seed.slug, ...data },
    });
    const item = await db.libraryItem.findUnique({ where: { slug: seed.slug }, select: { id: true } });
    if (!item) continue;
    await db.libraryItemCreator.deleteMany({ where: { itemId: item.id } });
    for (let i = 0; i < seed.creators.length; i++) {
      const creatorId = await upsertCreator(db, seed.creators[i]);
      await db.libraryItemCreator.create({
        data: { itemId: item.id, creatorId, role: seed.creators[i].role, sortOrder: i },
      });
    }
  }

  await seedDemoFile(db);

  const counts = {
    items: await db.libraryItem.count(),
    withFile: await db.libraryItem.count({ where: { mediaId: { not: null } } }),
    journals: await db.libraryItem.count({ where: { type: "JOURNAL_ISSUE" } }),
    books: await db.libraryItem.count({ where: { type: "BOOK" } }),
    papers: await db.libraryItem.count({ where: { type: "PAPER" } }),
    categories: await db.libraryCategory.count(),
  };
  console.log(
    `  ✓ library: ${counts.items} items (${counts.books} বই, ${counts.journals} জার্নাল সংখ্যা, ${counts.papers} পেপার), ${counts.categories} categories, ${counts.withFile} with a readable PDF`,
  );
}

/**
 * Attach the demo reading file (a 6-page Bangla book PDF printed from the
 * institute's own Hind Siliguri/Amiri subsets) to the tawhid-primer item —
 * only while that item has NO file, so the office can replace it through
 * the admin and a re-seed never clobbers the real thing.
 */
async function seedDemoFile(db: Db): Promise<void> {
  const slug = "tawhid-primer";
  const existingItem = await db.libraryItem.findUnique({ where: { slug }, select: { id: true, mediaId: true } });
  if (!existingItem || existingItem.mediaId) return;

  let media = await db.media.findFirst({
    where: { filename: "tawhid-primer.pdf", kind: "DOCUMENT" },
    orderBy: { createdAt: "desc" },
  });
  if (!media) {
    try {
      const { uploadDocument } = await import("@/lib/storage/upload");
      const buf = await readFile(path.join(process.cwd(), "scripts", "seed-data", "assets", "tawhid-primer.pdf"));
      const uploaded = await uploadDocument("tawhid-primer.pdf", buf);
      media = await db.media.create({
        data: {
          key: uploaded.key,
          filename: uploaded.filename,
          mime: uploaded.mime,
          size: uploaded.size,
          kind: "DOCUMENT",
          uploadedById: null,
        },
      });
    } catch {
      console.log("  ⚠ library: demo PDF could not be stored — item stays without a file");
      return;
    }
  }
  await db.libraryItem.update({
    where: { slug },
    data: { mediaId: media.id, filePages: 6 },
  });
}
