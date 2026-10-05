import { z } from "zod";

/**
 * Round 3: the Site content / Site settings modules. Zod schemas for every
 * settings key the office can now edit, the MenuItem tree, HomeSection,
 * Stat, Faq and FeatureFlag writes. All admin routes validate through these
 * before touching Prisma.
 */

/* ————————————— SiteSetting values (typed JSON per key) ————————————— */

const label = (max = 300) => z.string().trim().max(max);
const url = z
  .string()
  .trim()
  .max(400)
  .refine((v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"), "http(s) বা / দিয়ে শুরু হতে হবে");

export const siteIdentitySchema = z.object({
  nameBn: label(200),
  nameEn: label(200),
  parentBn: label(200),
  parentEn: label(200),
  shortBn: label(120),
  shortEn: label(120),
  taglineBn: label(400),
  taglineEn: label(400),
});

export const siteContactSchema = z.object({
  addressBn: label(400),
  addressEn: label(400),
  campusAddressBn: label(400),
  campusAddressEn: label(400),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => /^[+0-9\-()\s]{6,20}$/.test(v), "সঠিক ফোন নম্বর দিন (ল্যাটিন সংখ্যায়)"),
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(200).or(z.literal("")),
  emailAdmission: z.string().trim().email("সঠিক ইমেইল দিন").max(200).or(z.literal("")),
  hoursBn: label(200),
  hoursEn: label(200),
  mapsEmbed: url,
  mapsLink: url,
  admissionNoteBn: label(600),
  admissionNoteEn: label(600),
});

export const siteSocialSchema = z.object({
  facebook: url,
  youtube: url,
  twitter: url,
  whatsapp: url,
});

export const sitePaymentSchema = z.object({
  bkash: label(200),
  nagad: label(200),
  rocket: label(200),
  bankBn: label(600),
});

export const zakatSettingSchema = z.object({
  nisabSilverGrams: z.number().min(1).max(10000),
  silverRateBdt: z.number().min(1).max(1000000),
  nisabGoldGrams: z.number().min(1).max(10000),
  goldRateBdt: z.number().min(1).max(100000000),
});

export const heroSettingSchema = z.object({
  mediaId: z.string().trim().max(60).nullable(),
});

/** Admission copy: the declaration on /admissions/apply + intro on /admissions. */
export const admissionsSettingSchema = z.object({
  declarationBn: label(4000),
  declarationEn: label(4000),
  applyIntroBn: label(2000),
  applyIntroEn: label(2000),
});

/** key → schema (the settings API's whitelist). */
export const SETTING_SCHEMAS: Record<string, z.ZodTypeAny> = {
  "site.identity": siteIdentitySchema,
  "site.contact": siteContactSchema,
  "site.social": siteSocialSchema,
  "site.payment": sitePaymentSchema,
  "donations.zakat": zakatSettingSchema,
  "site.hero": heroSettingSchema,
  "admissions.settings": admissionsSettingSchema,
};

/* ————————————— HomeSection + Stat (home page composition) ————————————— */

export const homeSectionUpdateSchema = z.object({
  key: z.string().trim().min(1).max(60),
  isEnabled: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  titleBn: label(200).optional(),
  titleEn: label(200).optional(),
});

export const homeSectionsPatchSchema = z.object({
  updates: z.array(homeSectionUpdateSchema).min(1).max(30),
});

export const statCreateSchema = z.object({
  value: z.number().int().min(0).max(100_000_000),
  suffixBn: label(40),
  suffixEn: label(40),
  labelBn: label(200),
  labelEn: label(200),
  iconKey: z.string().trim().max(40).nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).default(0),
  isPublished: z.boolean().default(true),
});

export const statUpdateSchema = statCreateSchema.partial();

/* ————————————— Faq ————————————— */

export const faqCreateSchema = z.object({
  categoryBn: label(120).default("সাধারণ"),
  categoryEn: label(120).default("General"),
  questionBn: z.string().trim().min(5, "প্রশ্ন লিখুন (কমপক্ষে ৫ অক্ষর)").max(600),
  questionEn: z.string().trim().max(600).default(""),
  answerBn: z.string().trim().min(5, "উত্তর লিখুন (কমপক্ষে ৫ অক্ষর)").max(4000),
  answerEn: z.string().trim().max(4000).default(""),
  sortOrder: z.number().int().min(0).max(999).default(0),
  isPublished: z.boolean().default(true),
});

export const faqUpdateSchema = faqCreateSchema.partial();

/* ————————————— MenuItem tree ————————————— */

export const MENU_LOCATIONS = ["HEADER_MAIN", "HEADER_UTILITY", "FOOTER_PRIMARY", "FOOTER_SECONDARY", "MOBILE"] as const;

export const menuCreateSchema = z.object({
  location: z.enum(MENU_LOCATIONS),
  labelBn: label(120),
  labelEn: label(120),
  href: z
    .string()
    .trim()
    .min(1, "লিংক দিন")
    .max(300)
    .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "/ বা http(s) দিয়ে শুরু হতে হবে"),
  parentId: z.string().trim().max(40).nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).default(0),
  isVisible: z.boolean().default(true),
  flagKey: z.string().trim().max(60).nullable().optional(),
});

export const menuUpdateSchema = menuCreateSchema.partial().extend({
  direction: z.enum(["up", "down"]).optional(),
});

/* ————————————— FeatureFlag ————————————— */

export const flagPatchSchema = z.object({
  key: z.string().trim().min(1).max(60),
  isEnabled: z.boolean(),
});

export const flagsPatchSchema = z.object({
  updates: z.array(flagPatchSchema).min(1).max(30),
});
