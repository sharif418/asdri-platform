import { db } from "@/lib/db";
/** Lowercase slug from an English title — imported for the journalKey derivation. */
import { slugify, buildUniqueSlug, slugifyTitle } from "@/lib/slug";
import type { LibraryCreatorInput, LibraryPublisherInput } from "@/lib/validators/admin-library";

/**
 * Library module helpers shared by the admin API routes — creator/publisher
 * upserts (by name pair, so the office types free text) and slug derivation.
 * Kept here so the route files stay thin and the public catalogue (round 4,
 * workstream 5) can reuse the same derivation.
 */

/** Find-or-create a creator row by the exact (nameBn, nameEn) pair. */
export async function upsertLibraryCreator(input: LibraryCreatorInput): Promise<{ id: string }> {
  const existing = await db.libraryCreator.findFirst({
    where: { nameBn: input.nameBn, nameEn: input.nameEn },
    select: { id: true },
  });
  if (existing) return existing;
  return db.libraryCreator.create({
    data: { nameBn: input.nameBn, nameEn: input.nameEn },
    select: { id: true },
  });
}

/** Find-or-create a publisher row by the exact (nameBn, nameEn) pair. */
export async function upsertLibraryPublisher(input: LibraryPublisherInput): Promise<{ id: string }> {
  const existing = await db.libraryPublisher.findFirst({
    where: { nameBn: input.nameBn, nameEn: input.nameEn },
    select: { id: true },
  });
  if (existing) return existing;
  return db.libraryPublisher.create({
    data: { nameBn: input.nameBn, nameEn: input.nameEn },
    select: { id: true },
  });
}

/** Resolve the repeater rows into link payloads (upserting creators, keeping order). */
export async function resolveLibraryCreatorLinks(
  creators: LibraryCreatorInput[],
): Promise<{ creatorId: string; role: LibraryCreatorInput["role"]; sortOrder: number }[]> {
  const links: { creatorId: string; role: LibraryCreatorInput["role"]; sortOrder: number }[] = [];
  for (let i = 0; i < creators.length; i++) {
    const creator = creators[i];
    const row = await upsertLibraryCreator(creator);
    links.push({ creatorId: row.id, role: creator.role, sortOrder: i });
  }
  return links;
}

/** Item slug from titleEn (preferred) or titleBn, guaranteed unique. */
export async function buildLibraryItemSlug(titleEn: string, titleBn: string): Promise<string> {
  return buildUniqueSlug(slugify(titleEn || titleBn), async (candidate) => {
    const existing = await db.libraryItem.findUnique({ where: { slug: candidate }, select: { id: true } });
    return !!existing;
  });
}

/**
 * journalKey groups issues of the same journal. Explicit value wins; empty
 * falls back to the slug of the journal's English name (deterministic — a
 * Bangla-only name cannot produce one, so such rows stay ungrouped until the
 * librarian types a key; the item-form dialog previews the same value).
 */
export function deriveJournalKey(journalKey: string | undefined, journalNameEn: string | undefined, journalNameBn: string | undefined): string {
  const explicit = (journalKey ?? "").trim();
  if (explicit) return explicit;
  const nameEn = (journalNameEn ?? "").trim();
  if (nameEn) return slugifyTitle(nameEn);
  void journalNameBn;
  return "";
}
