import { z } from "zod";
import { sanitizeRichText } from "@/lib/sanitize";

/**
 * Admin validators — research & publications (journal issues, research
 * projects, download centre resources). Bangla error copy for the office UI.
 */

/* ————————— Publications (journal / book / bulletin / paper) ————————— */

export const PUBLICATION_KINDS = ["JOURNAL", "MAGAZINE", "BULLETIN", "BOOK", "PAPER"] as const;

export const publicationCreateSchema = z.object({
  titleBn: z.string().trim().min(3, "বাংলা শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(300),
  titleEn: z.string().trim().max(300).optional().default(""),
  abstractBn: z.string().trim().max(2000).optional().default(""),
  abstractEn: z.string().trim().max(2000).optional().default(""),
  authorsBn: z.string().trim().max(500).optional().default(""),
  authorsEn: z.string().trim().max(500).optional().default(""),
  kind: z.enum(PUBLICATION_KINDS).optional().default("JOURNAL"),
  year: z
    .number({ message: "সাল সংখ্যায় লিখুন" })
    .int("সাল পূর্ণসংখ্যায় হতে হবে")
    .min(1950, "সাল ১৯৫০-এর পরের হতে হবে")
    .max(2100, "সাল ২১০০-এর আগের হতে হবে"),
  isbn: z.string().trim().max(40).optional().or(z.literal("")),
  issn: z.string().trim().max(40).optional().or(z.literal("")),
  coverMediaId: z.string().nullable().optional(),
  fileMediaId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).optional().default(0),
  isPublished: z.boolean().optional().default(true),
});
export type PublicationCreateInput = z.infer<typeof publicationCreateSchema>;

export const publicationUpdateSchema = publicationCreateSchema.partial();
export type PublicationUpdateInput = z.infer<typeof publicationUpdateSchema>;

/** Sanitise rich-text abstract fields (editors may paste formatted text). */
export function sanitizePublicationPayload<T extends { abstractBn?: string; abstractEn?: string }>(payload: T): T {
  return {
    ...payload,
    abstractBn: sanitizeRichText(payload.abstractBn ?? ""),
    abstractEn: sanitizeRichText(payload.abstractEn ?? ""),
  };
}

/* ————————— Research projects ————————— */

export const researchProjectCreateSchema = z.object({
  titleBn: z.string().trim().min(3, "বাংলা শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(300),
  titleEn: z.string().trim().max(300).optional().default(""),
  summaryBn: z.string().optional().default(""),
  summaryEn: z.string().optional().default(""),
  progress: z.number().int().min(0, "অগ্রগতি ০–১০০ এর মধ্যে").max(100, "অগ্রগতি ০–১০০ এর মধ্যে").optional().default(0),
  statusBn: z.string().trim().max(120).optional().default(""),
  statusEn: z.string().trim().max(120).optional().default(""),
  isCallForPapers: z.boolean().optional().default(false),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "তারিখ YYYY-MM-DD আকারে দিন")
    .optional()
    .or(z.literal("")),
  isPublished: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).max(999).optional().default(0),
});
export type ResearchProjectCreateInput = z.infer<typeof researchProjectCreateSchema>;

export const researchProjectUpdateSchema = researchProjectCreateSchema.partial();
export type ResearchProjectUpdateInput = z.infer<typeof researchProjectUpdateSchema>;

/** Sanitise rich-text summary fields. */
export function sanitizeResearchPayload<T extends { summaryBn?: string; summaryEn?: string }>(payload: T): T {
  return {
    ...payload,
    summaryBn: sanitizeRichText(payload.summaryBn ?? ""),
    summaryEn: sanitizeRichText(payload.summaryEn ?? ""),
  };
}

/* ————————— Download centre resources ————————— */

export const downloadResourceCreateSchema = z.object({
  titleBn: z.string().trim().min(3, "বাংলা শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(200),
  titleEn: z.string().trim().max(200).optional().default(""),
  descriptionBn: z.string().trim().max(1000).optional().default(""),
  descriptionEn: z.string().trim().max(1000).optional().default(""),
  categoryBn: z.string().trim().min(2, "বাংলা ক্যাটাগরি কমপক্ষে ২ অক্ষরের হতে হবে").max(120).optional().default("সাধারণ"),
  categoryEn: z.string().trim().max(120).optional().default("General"),
  fileMediaId: z.string().nullable().optional(),
  courseId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).optional().default(0),
  isPublished: z.boolean().optional().default(true),
});
export type DownloadResourceCreateInput = z.infer<typeof downloadResourceCreateSchema>;

export const downloadResourceUpdateSchema = downloadResourceCreateSchema.partial();
export type DownloadResourceUpdateInput = z.infer<typeof downloadResourceUpdateSchema>;
