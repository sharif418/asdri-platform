import { Prisma, type LibraryItemType } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Public library data layer — the catalogue's server queries (round 4,
 * workstream 4b). This file holds the view models, the shared card mapper
 * and the full record lookup by slug. Its two siblings carry the rest so
 * each stays inside the 500-line house style: library-search.ts (bilingual
 * search + facets) and library-shelves.ts (category tree, year/language
 * facets, journal groups, related items, the read counter).
 *
 * MEMBERS-visibility rows are INCLUDED everywhere (the catalogue marks
 * them); gating the file/reader behind a session is page-level, never a
 * query-level concern here.
 */

/* ————————————————————— view models ————————————————————— */

export type LibraryVisibilityValue = "PUBLIC" | "MEMBERS";
export type LibraryCreatorRoleValue = "AUTHOR" | "EDITOR" | "TRANSLATOR";

export interface LibraryCreatorView {
  name: { bn: string; en: string };
  role: LibraryCreatorRoleValue;
}

export interface LibraryCategoryRef {
  slug: string;
  name: { bn: string; en: string };
}

export interface LibraryJournalRef {
  key: string;
  name: { bn: string; en: string };
  volume: string;
  issueLabel: string;
}

/** A catalogue card / related-item row — everything the grid needs. */
export interface LibraryCardItem {
  id: string;
  slug: string;
  type: LibraryItemType;
  title: { bn: string; en: string };
  subtitle: { bn: string; en: string };
  year: number | null;
  language: string;
  visibility: LibraryVisibilityValue;
  category: LibraryCategoryRef | null;
  creators: LibraryCreatorView[];
  journal: LibraryJournalRef | null;
  /** /api/media/… when a PDF is attached, else null. */
  fileUrl: string | null;
  externalUrl: string | null;
  coverUrl: string | null;
}

/** The full record page payload (plus reading-related bits). */
export interface LibraryItemDetail extends LibraryCardItem {
  description: { bn: string; en: string }; // sanitized rich HTML
  publisher: { name: { bn: string; en: string } } | null;
  publishPlaceBn: string;
  isbn: string | null;
  issn: string | null;
  doi: string | null;
  editionBn: string;
  filePages: number | null;
  updatedAt: Date;
}

export interface LibraryCategoryNode {
  slug: string;
  name: { bn: string; en: string };
  /** Published items in this category or any descendant. */
  count: number;
  children: LibraryCategoryNode[];
}

export interface LibraryJournalIssueRef {
  slug: string;
  title: { bn: string; en: string };
  volume: string;
  issueLabel: string;
  year: number | null;
}

export interface LibraryJournalGroup {
  key: string;
  name: { bn: string; en: string };
  issues: LibraryJournalIssueRef[];
  issueCount: number;
  latestYear: number | null;
}

export interface LibrarySearchResult {
  items: LibraryCardItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  /** How the text search matched (no query → "fallback" by definition). */
  mode: "tsvector" | "fallback";
}

/* ————————————————————— shared selects ————————————————————— */

export const CARD_SELECT = {
  id: true,
  slug: true,
  type: true,
  titleBn: true,
  titleEn: true,
  subtitleBn: true,
  subtitleEn: true,
  publishYear: true,
  language: true,
  visibility: true,
  volume: true,
  issueLabel: true,
  journalKey: true,
  journalNameBn: true,
  journalNameEn: true,
  externalUrl: true,
  category: { select: { slug: true, nameBn: true, nameEn: true } },
  creators: {
    orderBy: { sortOrder: "asc" as const },
    select: { role: true, creator: { select: { nameBn: true, nameEn: true } } },
  },
  media: { select: { key: true } },
  coverMedia: { select: { key: true } },
} satisfies Prisma.LibraryItemSelect;

export type CardRow = Prisma.LibraryItemGetPayload<{ select: typeof CARD_SELECT }>;

export function toCard(row: CardRow): LibraryCardItem {
  const journalKey = row.journalKey.trim();
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    title: { bn: row.titleBn, en: row.titleEn || row.titleBn },
    subtitle: { bn: row.subtitleBn, en: row.subtitleEn || row.subtitleBn },
    year: row.publishYear,
    language: row.language,
    visibility: row.visibility,
    category: row.category
      ? {
          slug: row.category.slug,
          name: {
            bn: row.category.nameBn,
            en: row.category.nameEn || row.category.nameBn,
          },
        }
      : null,
    creators: row.creators.map((link) => ({
      name: {
        bn: link.creator.nameBn,
        en: link.creator.nameEn || link.creator.nameBn,
      },
      role: link.role,
    })),
    journal:
      journalKey && row.type === "JOURNAL_ISSUE"
        ? {
            key: journalKey,
            name: {
              bn: row.journalNameBn,
              en: row.journalNameEn || row.journalNameBn,
            },
            volume: row.volume,
            issueLabel: row.issueLabel,
          }
        : null,
    fileUrl: row.media ? `/api/media/${row.media.key}` : null,
    externalUrl: row.externalUrl,
    coverUrl: row.coverMedia ? `/api/media/${row.coverMedia.key}` : null,
  };
}

/* ————————————————————— search + filters ————————————————————— */

/* ————————————————————— single record ————————————————————— */

/** Full record by slug, or null (drafts and unknown slugs alike). */
export async function getLibraryItemBySlug(
  slug: string,
): Promise<LibraryItemDetail | null> {
  const row = await db.libraryItem.findUnique({
    where: { slug },
    include: {
      category: { select: { slug: true, nameBn: true, nameEn: true } },
      publisher: { select: { nameBn: true, nameEn: true } },
      creators: {
        orderBy: { sortOrder: "asc" },
        include: { creator: { select: { nameBn: true, nameEn: true } } },
      },
      media: { select: { key: true } },
      coverMedia: { select: { key: true } },
    },
  });
  if (!row || !row.isPublished) return null;

  const journalKey = row.journalKey.trim();
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    title: { bn: row.titleBn, en: row.titleEn || row.titleBn },
    subtitle: { bn: row.subtitleBn, en: row.subtitleEn || row.subtitleBn },
    description: {
      bn: row.descriptionBn,
      en: row.descriptionEn || row.descriptionBn,
    },
    year: row.publishYear,
    language: row.language,
    visibility: row.visibility,
    category: row.category
      ? {
          slug: row.category.slug,
          name: {
            bn: row.category.nameBn,
            en: row.category.nameEn || row.category.nameBn,
          },
        }
      : null,
    creators: row.creators.map((link) => ({
      name: {
        bn: link.creator.nameBn,
        en: link.creator.nameEn || link.creator.nameBn,
      },
      role: link.role,
    })),
    publisher: row.publisher
      ? {
          name: {
            bn: row.publisher.nameBn,
            en: row.publisher.nameEn || row.publisher.nameBn,
          },
        }
      : null,
    publishPlaceBn: row.publishPlaceBn,
    isbn: row.isbn,
    issn: row.issn,
    doi: row.doi,
    editionBn: row.editionBn,
    journal:
      journalKey && row.type === "JOURNAL_ISSUE"
        ? {
            key: journalKey,
            name: {
              bn: row.journalNameBn,
              en: row.journalNameEn || row.journalNameBn,
            },
            volume: row.volume,
            issueLabel: row.issueLabel,
          }
        : null,
    fileUrl: row.media ? `/api/media/${row.media.key}` : null,
    filePages: row.filePages,
    externalUrl: row.externalUrl,
    coverUrl: row.coverMedia ? `/api/media/${row.coverMedia.key}` : null,
    updatedAt: row.updatedAt,
  };
}
