import { z } from "zod";

/**
 * Admin + portal validators — the alumni registry (round-9 restore of the
 * round-6 module). Bangla error copy for the admissions officer's UI. The
 * course keys mirror Course.code; the registry number is office-generated
 * (AL-YYYY-NNNN) so the create schema never accepts one.
 */

export const ALUMNI_COURSE_KEYS = ["PYS", "PGDID", "CCIS", "ATT"] as const;

const currentYear = new Date().getFullYear();

export const alumniProfileCreateSchema = z.object({
  nameBn: z.string().trim().min(3, "বাংলা নাম কমপক্ষে ৩ অক্ষরের হতে হবে").max(150),
  nameEn: z.string().trim().max(150).optional().default(""),
  courseKey: z.enum(ALUMNI_COURSE_KEYS, { message: "কার্যক্রম বেছে নিন" }),
  batchYear: z
    .number({ message: "ব্যাচের সাল সংখ্যায় লিখুন" })
    .int("ব্যাচের সাল পূর্ণসংখ্যায় লিখুন")
    .min(1990, "ব্যাচের সাল ১৯৯০-এর পরে হতে হবে")
    .max(currentYear + 1, "ব্যাচের সাল ভবিষ্যতের হতে পারে না"),
  batchNoBn: z.string().trim().max(60).optional().default(""),
  occupationBn: z.string().trim().max(150).optional().default(""),
  occupationEn: z.string().trim().max(150).optional().default(""),
  organizationBn: z.string().trim().max(200).optional().default(""),
  organizationEn: z.string().trim().max(200).optional().default(""),
  districtBn: z.string().trim().max(80).optional().default(""),
  districtEn: z.string().trim().max(80).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().email("ইমেইল ঠিকভাবে লিখুন").max(200).or(z.literal("")).optional().default(""),
  addressBn: z.string().trim().max(400).optional().default(""),
  isPublished: z.boolean().optional().default(false),
});
export type AlumniProfileCreateInput = z.infer<typeof alumniProfileCreateSchema>;

/** Office edits may change anything, in any subset. */
export const alumniProfileUpdateSchema = alumniProfileCreateSchema.partial();

/** The alumnus's own self-service update — contact + present life only. */
export const alumniSelfUpdateSchema = z.object({
  phone: z.string().trim().max(40, "ফোন নম্বরটি খুব দীর্ঘ").optional(),
  email: z.string().trim().email("ইমেইল ঠিকভাবে লিখুন").max(200).or(z.literal("")).optional(),
  addressBn: z.string().trim().max(400, "ঠিকানাটি খুব দীর্ঘ").optional(),
  occupationBn: z.string().trim().max(150, "পেশার বিবরণ খুব দীর্ঘ").optional(),
  organizationBn: z.string().trim().max(200, "প্রতিষ্ঠানের নাম খুব দীর্ঘ").optional(),
  districtBn: z.string().trim().max(80, "জেলার নাম খুব দীর্ঘ").optional(),
});

export const alumniListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  courseKey: z.enum(ALUMNI_COURSE_KEYS).optional(),
  published: z.enum(["all", "yes", "no"]).optional(),
});

/** Public directory query — the visitor's filters (privacy layer is separate). */
export const alumniDirectoryQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  course: z.enum(ALUMNI_COURSE_KEYS).optional(),
  page: z.coerce.number().int().min(1).max(500).optional(),
});
