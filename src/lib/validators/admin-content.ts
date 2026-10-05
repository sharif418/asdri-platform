import { z } from "zod";
import { sanitizeRichText } from "@/lib/sanitize";

/**
 * Admin validators — academics (teams, people) + content (posts, categories,
 * albums, album images, videos). Bangla error copy for the office UI;
 * rich text is sanitised server-side.
 */

/* ————————— Teams ————————— */

export const teamCreateSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "কী-তে ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন")
    .min(2)
    .max(60),
  nameBn: z.string().trim().min(2, "দলের বাংলা নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(120),
  nameEn: z.string().trim().max(120).optional().default(""),
  descriptionBn: z.string().trim().max(500).optional().default(""),
  descriptionEn: z.string().trim().max(500).optional().default(""),
  sortOrder: z.number().int().min(0).max(999).optional().default(0),
  isPublished: z.boolean().optional().default(true),
});
export type TeamCreateInput = z.infer<typeof teamCreateSchema>;

export const teamUpdateSchema = teamCreateSchema.partial();
export type TeamUpdateInput = z.infer<typeof teamUpdateSchema>;

/** Reorder-only payload: [{ id, sortOrder }] — full tree rebuild order. */
export const teamReorderSchema = z.object({
  order: z
    .array(z.object({ id: z.string().min(1), sortOrder: z.number().int().min(0).max(999) }))
    .min(1)
    .max(50),
});

/* ————————— People ————————— */

export const personCreateSchema = z.object({
  nameBn: z.string().trim().min(3, "বাংলা নাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(150),
  nameEn: z.string().trim().max(150).optional().default(""),
  titleBn: z.string().trim().max(150).optional().default(""),
  titleEn: z.string().trim().max(150).optional().default(""),
  roleTitleBn: z.string().trim().max(200).optional().default(""),
  roleTitleEn: z.string().trim().max(200).optional().default(""),
  bioBn: z.string().optional().default(""),
  bioEn: z.string().optional().default(""),
  subjectsBn: z.string().trim().max(500).optional().default(""),
  subjectsEn: z.string().trim().max(500).optional().default(""),
  teamId: z.string().nullable().optional(),
  photoMediaId: z.string().nullable().optional(),
  isPublished: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).max(999).optional().default(0),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "স্লাগে ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন")
    .min(3)
    .max(120)
    .optional(),
});
export type PersonCreateInput = z.infer<typeof personCreateSchema>;

export const personUpdateSchema = personCreateSchema.partial();
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>;

/** Sanitise rich-text bio fields in validated person payloads. */
export function sanitizePersonPayload<T extends { bioBn?: string; bioEn?: string }>(payload: T): T {
  return {
    ...payload,
    bioBn: sanitizeRichText(payload.bioBn ?? ""),
    bioEn: sanitizeRichText(payload.bioEn ?? ""),
  };
}

/* ————————— Post categories ————————— */

export const postCategoryCreateSchema = z.object({
  nameBn: z.string().trim().min(2, "ক্যাটাগরির বাংলা নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(120),
  nameEn: z.string().trim().max(120).optional().default(""),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "স্লাগে ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন")
    .min(2)
    .max(120)
    .optional(),
  sortOrder: z.number().int().min(0).max(999).optional().default(0),
});
export type PostCategoryCreateInput = z.infer<typeof postCategoryCreateSchema>;

/* ————————— Posts ————————— */

export const postKindSchema = z.enum(["ARTICLE", "CLARIFICATION", "NEWS"]);

export const postCreateSchema = z.object({
  titleBn: z.string().trim().min(3, "বাংলা শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(300),
  titleEn: z.string().trim().max(300).optional().default(""),
  excerptBn: z.string().trim().max(500).optional().default(""),
  excerptEn: z.string().trim().max(500).optional().default(""),
  bodyBn: z.string().optional().default(""),
  bodyEn: z.string().optional().default(""),
  kind: postKindSchema.optional().default("ARTICLE"),
  categoryId: z.string().nullable().optional(),
  authorId: z.string().nullable().optional(),
  coverMediaId: z.string().nullable().optional(),
  isPublished: z.boolean().optional().default(false),
  publishedAt: z.string().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "স্লাগে ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন")
    .min(3)
    .max(120)
    .optional(),
});
export type PostCreateInput = z.infer<typeof postCreateSchema>;

export const postUpdateSchema = postCreateSchema.partial();
export type PostUpdateInput = z.infer<typeof postUpdateSchema>;

/** Sanitise rich-text body fields in validated post payloads. */
export function sanitizePostPayload<T extends { bodyBn?: string; bodyEn?: string }>(payload: T): T {
  return {
    ...payload,
    bodyBn: sanitizeRichText(payload.bodyBn ?? ""),
    bodyEn: sanitizeRichText(payload.bodyEn ?? ""),
  };
}

/* ————————— Albums ————————— */

export const albumCreateSchema = z.object({
  titleBn: z.string().trim().min(3, "অ্যালবামের বাংলা শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(200),
  titleEn: z.string().trim().max(200).optional().default(""),
  descriptionBn: z.string().trim().max(1000).optional().default(""),
  descriptionEn: z.string().trim().max(1000).optional().default(""),
  coverMediaId: z.string().nullable().optional(),
  isPublished: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).max(999).optional().default(0),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "স্লাগে ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন")
    .min(3)
    .max(120)
    .optional(),
});
export type AlbumCreateInput = z.infer<typeof albumCreateSchema>;

export const albumUpdateSchema = albumCreateSchema.partial();
export type AlbumUpdateInput = z.infer<typeof albumUpdateSchema>;

/* ————————— Album images ————————— */

export const albumImagesAddSchema = z.object({
  mediaIds: z.array(z.string().min(1)).min(1, "অন্তত একটি ছবি নির্বাচন করুন").max(100),
});

export const albumImageUpdateSchema = z.object({
  captionBn: z.string().trim().max(300).optional(),
  captionEn: z.string().trim().max(300).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});
export type AlbumImageUpdateInput = z.infer<typeof albumImageUpdateSchema>;

/* ————————— Videos ————————— */

export const videoCreateSchema = z.object({
  titleBn: z.string().trim().min(3, "বাংলা শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(200),
  titleEn: z.string().trim().max(200).optional().default(""),
  descriptionBn: z.string().trim().max(1000).optional().default(""),
  descriptionEn: z.string().trim().max(1000).optional().default(""),
  youtubeUrl: z.string().trim().min(4, "ইউটিউব লিংক বা ভিডিও আইডি দিন").max(500),
  playlistKey: z.string().trim().min(1, "প্লেলিস্ট নির্বাচন করুন").max(120),
  sortOrder: z.number().int().min(0).max(999).optional().default(0),
  isPublished: z.boolean().optional().default(true),
});
export type VideoCreateInput = z.infer<typeof videoCreateSchema>;

export const videoUpdateSchema = videoCreateSchema.partial();
export type VideoUpdateInput = z.infer<typeof videoUpdateSchema>;
