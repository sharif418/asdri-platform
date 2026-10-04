/**
 * Database seed — loads the institute's own content (from the client
 * documents, via the round-1 content modules) into PostgreSQL, imports the
 * placeholder images into object storage as real Media records, and creates
 * the first administrator from the environment.
 *
 *   bun scripts/seed.ts        (or: bun run db:seed)
 *
 * Idempotent: safe to re-run; trees (curricula, menus, stats) are rebuilt,
 * everything else upserts on its natural key.
 *
 * The admin password is NEVER hard-coded — the seed refuses to run without
 * SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in the environment.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { seedSettings } from "./seed-data/settings";
import { seedAcademics } from "./seed-data/academics";
import { seedContent } from "./seed-data/content";
import { uploadImage } from "@/lib/storage/upload";
import { hashPassword } from "@/lib/auth";
import { env } from "@/lib/env";

const db = new PrismaClient();

/** Import public/images placeholders into object storage + Media rows. */
async function importMedia(): Promise<Map<string, string>> {
  const mediaByPath = new Map<string, string>();
  const dir = path.join(process.cwd(), "public", "images");
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  } catch {
    return mediaByPath;
  }

  for (const file of files) {
    const publicPath = `/images/${file}`;
    const existing = await db.media.findFirst({
      where: { filename: file, kind: "IMAGE" },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      mediaByPath.set(publicPath, existing.id);
      continue;
    }
    try {
      const buf = await readFile(path.join(dir, file));
      const uploaded = await uploadImage(file, buf);
      const row = await db.media.create({
        data: {
          key: uploaded.key,
          filename: file,
          mime: uploaded.mime,
          size: uploaded.size,
          width: uploaded.width ?? null,
          height: uploaded.height ?? null,
          variants: (uploaded.variants ?? undefined) as never,
          kind: "IMAGE",
          altBn: "",
          altEn: "",
        },
      });
      mediaByPath.set(publicPath, row.id);
    } catch (error) {
      console.warn(`  ! media import skipped (${file}): ${(error as Error).message}`);
    }
  }
  console.log(`  ✓ ${mediaByPath.size} media records imported to object storage`);
  return mediaByPath;
}

/** Attach media to the entities that referenced /images/... paths. */
async function attachMedia(mediaByPath: Map<string, string>): Promise<void> {
  if (mediaByPath.size === 0) return;

  // blog covers
  const coverBySlug: Record<string, string> = {
    "scientism-science-or-faith": "/images/blog-science.png",
    "secularism-critique-islamic-perspective": "/images/blog-secularism.png",
    "atheism-skepticism-response": "/images/blog-atheism.png",
    "women-rights-islam-feminist-objections": "/images/blog-feminism.png",
    "orientalism-hadith-criticism-review": "/images/blog-orientalism.png",
  };
  for (const [slug, cover] of Object.entries(coverBySlug)) {
    const mediaId = mediaByPath.get(cover);
    if (!mediaId) continue;
    await db.post.update({ where: { slug }, data: { coverMediaId: mediaId } }).catch(() => undefined);
  }

  // hero image → settings
  const hero = mediaByPath.get("/images/hero-campus.png");
  if (hero) {
    await db.siteSetting.upsert({
      where: { key: "site.hero" },
      update: { value: { mediaId: hero } as never },
      create: { key: "site.hero", value: { mediaId: hero } as never },
    });
  }

  // campus/facility images
  const facilityImages: { titleBn: string; cover: string }[] = [
    { titleBn: "বুদ্ধিবৃত্তিক চর্চা", cover: "/images/student-debate.png" },
    { titleBn: "সেমিনার ও ওয়ার্কশপ", cover: "/images/campus-seminar.png" },
    { titleBn: "পাঠচক্র", cover: "/images/study-circle.png" },
    { titleBn: "ফিল্ডওয়ার্ক ও দাওয়াতি অভিজ্ঞতা", cover: "/images/campus-fieldwork.png" },
  ];
  for (const fi of facilityImages) {
    const mediaId = mediaByPath.get(fi.cover);
    if (!mediaId) continue;
    const facility = await db.facility.findFirst({ where: { titleBn: fi.titleBn } });
    if (facility) {
      await db.facility.update({ where: { id: facility.id }, data: { imageMediaId: mediaId } });
    }
  }

  // gallery albums from round-1 photos
  const albumSeeds: { slug: string; titleBn: string; titleEn: string; photos: { cover: string; captionBn: string; captionEn: string }[] }[] = [
    {
      slug: "campus-life",
      titleBn: "ক্যাম্পাস ও লাইব্রেরি",
      titleEn: "Campus & Library",
      photos: [
        { cover: "/images/campus-library.png", captionBn: "সমৃদ্ধ লাইব্রেরি", captionEn: "The enriched library" },
        { cover: "/images/campus-classroom.png", captionBn: "ক্লাসরুম পরিবেশ", captionEn: "Classroom environment" },
        { cover: "/images/campus-mosque.png", captionBn: "ক্যাম্পাস মসজিদ", captionEn: "Campus mosque" },
      ],
    },
    {
      slug: "fieldwork-2026",
      titleBn: "বার্ষিক দাওয়াহ ফিল্ডওয়ার্ক",
      titleEn: "Annual Dawah Fieldwork",
      photos: [
        { cover: "/images/campus-fieldwork.png", captionBn: "ফিল্ডওয়ার্কে শিক্ষার্থীরা", captionEn: "Students in the field" },
        { cover: "/images/campus-graduation.png", captionBn: "সমাপনী অনুষ্ঠান", captionEn: "Completion ceremony" },
      ],
    },
    {
      slug: "azan-training-sessions",
      titleBn: "আযান প্রশিক্ষণ সেশন",
      titleEn: "Azan Training Sessions",
      photos: [
        { cover: "/images/azan-training.png", captionBn: "মাখরাজ চর্চা", captionEn: "Makhraj practice" },
      ],
    },
  ];
  for (const album of albumSeeds) {
    const existing = await db.album.findUnique({ where: { slug: album.slug } });
    const coverMedia = mediaByPath.get(album.photos[0]?.cover ?? "");
    const row =
      existing ??
      (await db.album.create({
        data: {
          slug: album.slug,
          titleBn: album.titleBn,
          titleEn: album.titleEn,
          descriptionBn: "",
          descriptionEn: "",
          isPublished: true,
          coverMediaId: coverMedia ?? null,
        },
      }));
    if (existing) {
      await db.album.update({ where: { id: row.id }, data: { coverMediaId: coverMedia ?? existing.coverMediaId } });
    }
    // (re)build images
    await db.albumImage.deleteMany({ where: { albumId: row.id } });
    for (let i = 0; i < album.photos.length; i++) {
      const photo = album.photos[i];
      const mediaId = mediaByPath.get(photo.cover);
      if (!mediaId) continue;
      await db.albumImage.create({
        data: {
          albumId: row.id,
          mediaId,
          captionBn: photo.captionBn,
          captionEn: photo.captionEn,
          sortOrder: i,
        },
      });
    }
  }
  console.log("  ✓ media attached to posts, facilities, albums, hero");
}

async function seedAdmin(): Promise<void> {
  const email = env.seedAdminEmail;
  const password = env.seedAdminPassword;
  if (!email || !password) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set — the platform never seeds a default password. Generate one with: openssl rand -base64 24",
    );
  }
  if (password.length < 10) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 10 characters.");
  }
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // keep the current password on re-seed (the office may have changed it)
    await db.user.update({ where: { id: existing.id }, data: { role: "ADMIN", isActive: true } });
    console.log(`  ✓ admin exists: ${email}`);
    return;
  }
  await db.user.create({
    data: {
      email,
      name: "প্রশাসক",
      role: "ADMIN",
      passwordHash: hashPassword(password),
    },
  });
  console.log(`  ✓ admin created: ${email} (change the password after first login)`);
}

async function main(): Promise<void> {
  console.log("🌱 Seeding ASDRI platform (PostgreSQL)…");

  await seedSettings(db);
  await seedAcademics(db);
  await seedContent(db);
  const mediaByPath = await importMedia();
  await attachMedia(mediaByPath);
  await seedAdmin();

  const counts = {
    courses: await db.course.count(),
    semesters: await db.semester.count(),
    subjects: await db.subject.count(),
    people: await db.person.count(),
    teams: await db.team.count(),
    notices: await db.notice.count(),
    posts: await db.post.count(),
    albums: await db.album.count(),
    videos: await db.video.count(),
    media: await db.media.count(),
    fatwa: await db.fatwaEntry.count(),
    faqs: await db.faq.count(),
    funds: await db.fund.count(),
    campaigns: await db.campaign.count(),
    stats: await db.stat.count(),
    menus: await db.menuItem.count(),
    settings: await db.siteSetting.count(),
    flags: await db.featureFlag.count(),
  };
  console.log("📊", counts);
  console.log("✅ Seed complete.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void db.$disconnect();
  });
