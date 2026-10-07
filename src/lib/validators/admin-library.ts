import { z } from "zod";
import { sanitizeRichText } from "@/lib/sanitize";

/**
 * Admin validators — the library module (catalogue items, categories,
 * checkouts). Bangla error copy for the librarian's UI. The item schema is
 * deliberately wide: one shelf table for books, journal issues, papers and
 * loose digital files; type-specific fields (volume, issueLabel, journal
 * names) apply to JOURNAL_ISSUE rows only.
 */

export const LIBRARY_ITEM_TYPES = ["BOOK", "JOURNAL_ISSUE", "PAPER", "DIGITAL_FILE"] as const;
export const LIBRARY_VISIBILITIES = ["PUBLIC", "MEMBERS"] as const;
export const LIBRARY_CREATOR_ROLES = ["AUTHOR", "EDITOR", "TRANSLATOR"] as const;
export const LIBRARY_LANGUAGES = ["bn", "en", "ar", "mixed"] as const;

/** A creator row as the admin repeater sends it — upserted by name pair. */
export const libraryCreatorInputSchema = z.object({
  nameBn: z.string().trim().min(2, "স্রষ্টার বাংলা নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(200),
  nameEn: z.string().trim().max(200).optional().default(""),
  role: z.enum(LIBRARY_CREATOR_ROLES).optional().default("AUTHOR"),
});
export type LibraryCreatorInput = z.infer<typeof libraryCreatorInputSchema>;

/** Publisher as free text — upserted by name pair, so no id juggling in the UI. */
export const libraryPublisherInputSchema = z.object({
  nameBn: z.string().trim().min(2, "প্রকাশকের বাংলা নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(200),
  nameEn: z.string().trim().max(200).optional().default(""),
});
export type LibraryPublisherInput = z.infer<typeof libraryPublisherInputSchema>;

export const libraryItemCreateSchema = z.object({
  type: z.enum(LIBRARY_ITEM_TYPES, { message: "ধরন বেছে নিন" }),
  titleBn: z.string().trim().min(3, "বাংলা শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(300),
  titleEn: z.string().trim().max(300).optional().default(""),
  subtitleBn: z.string().trim().max(300).optional().default(""),
  subtitleEn: z.string().trim().max(300).optional().default(""),
  descriptionBn: z.string().max(20000).optional().default(""),
  descriptionEn: z.string().max(20000).optional().default(""),
  language: z.enum(LIBRARY_LANGUAGES).optional().default("bn"),
  categoryId: z.string().nullable().optional(),
  creators: z.array(libraryCreatorInputSchema).max(20, "স্রষ্টা সর্বোচ্চ ২০ জন").optional().default([]),
  publisher: libraryPublisherInputSchema.nullable().optional(),
  publishYear: z
    .number({ message: "প্রকাশের সাল সংখ্যায় লিখুন" })
    .int("সাল পূর্ণসংখ্যায় হতে হবে")
    .min(1400, "সাল ১৪০০-এর পরের হতে হবে (হিজরি/গ্রেগরিয়ান)")
    .max(2100, "সাল ২১০০-এর আগের হতে হবে")
    .nullable()
    .optional(),
  publishPlaceBn: z.string().trim().max(120).optional().default(""),
  isbn: z.string().trim().max(40).optional().or(z.literal("")).nullable(),
  issn: z.string().trim().max(40).optional().or(z.literal("")).nullable(),
  doi: z.string().trim().max(120).optional().or(z.literal("")).nullable(),
  editionBn: z.string().trim().max(80).optional().default(""),
  volume: z.string().trim().max(40).optional().default(""),
  issueLabel: z.string().trim().max(80).optional().default(""),
  journalNameBn: z.string().trim().max(200).optional().default(""),
  journalNameEn: z.string().trim().max(200).optional().default(""),
  journalKey: z.string().trim().max(120).optional().default(""), // auto-slugged from journalName when empty
  mediaId: z.string().nullable().optional(),
  coverMediaId: z.string().nullable().optional(),
  filePages: z.number().int().min(1, "পৃষ্ঠা সংখ্যা ১ বা তার বেশি").max(100000).nullable().optional(),
  externalUrl: z
    .string()
    .trim()
    .url("সঠিক লিংক দিন (https://…)")
    .max(500)
    .optional()
    .or(z.literal(""))
    .nullable(),
  visibility: z.enum(LIBRARY_VISIBILITIES).optional().default("PUBLIC"),
  isPublished: z.boolean().optional().default(true),
});
export type LibraryItemCreateInput = z.infer<typeof libraryItemCreateSchema>;

/** PATCH: everything optional; `creators`/`publisher` replace wholesale when sent. */
export const libraryItemUpdateSchema = libraryItemCreateSchema.partial();
export type LibraryItemUpdateInput = z.infer<typeof libraryItemUpdateSchema>;

/** Sanitise the rich-text description fields (librarians may paste HTML). */
export function sanitizeLibraryItemPayload<T extends { descriptionBn?: string; descriptionEn?: string }>(payload: T): T {
  return {
    ...payload,
    descriptionBn: sanitizeRichText(payload.descriptionBn ?? ""),
    descriptionEn: sanitizeRichText(payload.descriptionEn ?? ""),
  };
}

/* ————————— Categories (two-level tree) ————————— */

export const libraryCategoryCreateSchema = z.object({
  nameBn: z.string().trim().min(2, "বাংলা নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(120),
  nameEn: z.string().trim().max(120).optional().default(""),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).optional().default(0),
});
export type LibraryCategoryCreateInput = z.infer<typeof libraryCategoryCreateSchema>;

/** PATCH: partial fields, or `direction: up|down` to swap with the neighbour. */
export const libraryCategoryUpdateSchema = libraryCategoryCreateSchema
  .partial()
  .extend({ direction: z.enum(["up", "down"]).optional() });
export type LibraryCategoryUpdateInput = z.infer<typeof libraryCategoryUpdateSchema>;

/* ————————— Checkouts (physical circulation) ————————— */

export const libraryCheckoutCreateSchema = z.object({
  itemId: z.string().min(1, "আইটেম বেছে নিন"),
  borrowerName: z.string().trim().min(2, "ধারগ্রহীতার নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(200),
  borrowerPhone: z.string().trim().max(40).optional().default(""),
  borrowerUserId: z.string().nullable().optional(),
  dueAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "ফেরতের তারিখ YYYY-MM-DD আকারে দিন")
    .optional()
    .or(z.literal(""))
    .nullable(),
  note: z.string().trim().max(1000).optional().default(""),
});
export type LibraryCheckoutCreateInput = z.infer<typeof libraryCheckoutCreateSchema>;

/** PATCH: mark returned (or un-return to fix a mistake). */
export const libraryCheckoutUpdateSchema = z.object({
  returned: z.boolean().optional(),
  returnedAt: z.string().datetime({ message: "সময় ISO আকারে দিন" }).nullable().optional(),
});
export type LibraryCheckoutUpdateInput = z.infer<typeof libraryCheckoutUpdateSchema>;

/* ————————— List query params ————————— */

/** GET /api/admin/library — search + type + category filters for the manager table. */
export const libraryItemListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  type: z.enum(LIBRARY_ITEM_TYPES).optional(),
  categoryId: z.string().trim().max(50).optional(),
});

/** GET /api/admin/library/checkouts — open / returned / all tab filter. */
export const libraryCheckoutListQuerySchema = z.object({
  status: z.enum(["open", "returned", "all"]).optional().default("all"),
  q: z.string().trim().max(120).optional(),
});
