import { z } from "zod";
import { sanitizeRichText } from "@/lib/sanitize";

/**
 * Admin API validators — Bangla error copy for the office UI.
 * Rich-text fields are sanitised server-side (never trust the editor).
 */

export const noticeCategorySchema = z.enum(["ADMISSION", "RECRUITMENT", "ACADEMIC", "GENERAL"]);
export const noticeStatusSchema = z.enum(["NEW", "ACTIVE", "CLOSED"]);

export const noticeCreateSchema = z.object({
  titleBn: z.string().trim().min(3, "বাংলা শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(300),
  titleEn: z.string().trim().max(300).optional().default(""),
  excerptBn: z.string().trim().max(500).optional().default(""),
  excerptEn: z.string().trim().max(500).optional().default(""),
  bodyBn: z.string().optional().default(""),
  bodyEn: z.string().optional().default(""),
  category: noticeCategorySchema,
  status: noticeStatusSchema.default("NEW"),
  pinned: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  publishedAt: z.string().datetime().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "স্লাগে ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন")
    .min(3)
    .max(120)
    .optional(),
  attachmentMediaId: z.string().nullable().optional(),
});
export type NoticeCreateInput = z.infer<typeof noticeCreateSchema>;

export const noticeUpdateSchema = noticeCreateSchema.partial();
export type NoticeUpdateInput = z.infer<typeof noticeUpdateSchema>;

/** Sanitise rich text in validated payloads. */
export function sanitizeNoticePayload<T extends { bodyBn?: string; bodyEn?: string }>(payload: T): T {
  return {
    ...payload,
    bodyBn: sanitizeRichText(payload.bodyBn ?? ""),
    bodyEn: sanitizeRichText(payload.bodyEn ?? ""),
  };
}
