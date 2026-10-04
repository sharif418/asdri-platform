import { z } from "zod";
import { sanitizeRichText } from "@/lib/sanitize";

/**
 * Admin validators — fatwa module (question inbox, fatwa bank entries,
 * categories). Bangla error copy for the office UI; rich text is sanitised
 * server-side.
 */

/* ————————— Fatwa question inbox ————————— */

export const FATWA_Q_STATUSES = ["PENDING", "ANSWERED", "PUBLISHED", "REJECTED"] as const;

export const fatwaQuestionPatchSchema = z
  .object({
    answer: z.string().trim().max(20000, "উত্তরটি অতিরিক্ত বড় — সংক্ষিপ্ত করুন").optional(),
    status: z.enum(FATWA_Q_STATUSES).optional(),
    note: z.string().trim().max(1000, "নোটটি অতিরিক্ত বড় — সংক্ষিপ্ত করুন").optional(),
  })
  .refine((data) => data.answer !== undefined || data.status !== undefined || data.note !== undefined, {
    message: "পরিবর্তনযোগ্য কোনো ফিল্ড পাওয়া যায়নি।",
  });
export type FatwaQuestionPatchInput = z.infer<typeof fatwaQuestionPatchSchema>;

/** Promote a question into the public fatwa bank. */
export const fatwaQuestionPublishSchema = z.object({
  questionEn: z.string().trim().max(2000).optional().default(""),
  answer: z.string().trim().max(20000).optional(),
  answeredBy: z
    .string()
    .trim()
    .min(2, "উত্তরদাতার নাম কমপক্ষে ২ অক্ষরের হতে হবে")
    .max(200)
    .optional()
    .default("গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট"),
  categoryId: z.string().nullable().optional(),
  isPublished: z.boolean().optional().default(true),
});
export type FatwaQuestionPublishInput = z.infer<typeof fatwaQuestionPublishSchema>;

/* ————————— Fatwa bank entries ————————— */

export const fatwaEntryCreateSchema = z.object({
  questionBn: z.string().trim().min(10, "বাংলা প্রশ্ন কমপক্ষে ১০ অক্ষরের হতে হবে").max(2000),
  questionEn: z.string().trim().max(2000).optional().default(""),
  answerBn: z.string().optional().default(""),
  answerEn: z.string().optional().default(""),
  answeredBy: z
    .string()
    .trim()
    .min(2, "উত্তরদাতার নাম কমপক্ষে ২ অক্ষরের হতে হবে")
    .max(200)
    .optional()
    .default("গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট"),
  categoryId: z.string().nullable().optional(),
  isPublished: z.boolean().optional().default(true),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "স্লাগে ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন")
    .min(3)
    .max(120)
    .optional(),
});
export type FatwaEntryCreateInput = z.infer<typeof fatwaEntryCreateSchema>;

export const fatwaEntryUpdateSchema = fatwaEntryCreateSchema.partial();
export type FatwaEntryUpdateInput = z.infer<typeof fatwaEntryUpdateSchema>;

/** Sanitise rich-text answer fields in validated fatwa payloads. */
export function sanitizeFatwaPayload<T extends { answerBn?: string; answerEn?: string }>(payload: T): T {
  return {
    ...payload,
    answerBn: sanitizeRichText(payload.answerBn ?? ""),
    answerEn: sanitizeRichText(payload.answerEn ?? ""),
  };
}

/* ————————— Fatwa categories ————————— */

export const fatwaCategoryRenameSchema = z.object({
  id: z.string().min(1),
  nameBn: z.string().trim().min(2, "ক্যাটাগরির বাংলা নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(120),
  nameEn: z.string().trim().min(2, "ইংরেজি নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(120),
});
export type FatwaCategoryRenameInput = z.infer<typeof fatwaCategoryRenameSchema>;

/** Reorder-only payload: [{ id, sortOrder }] — full list order rebuild. */
export const fatwaCategoryReorderSchema = z.object({
  order: z
    .array(z.object({ id: z.string().min(1), sortOrder: z.number().int().min(0).max(999) }))
    .min(1)
    .max(50),
});
export type FatwaCategoryReorderInput = z.infer<typeof fatwaCategoryReorderSchema>;
