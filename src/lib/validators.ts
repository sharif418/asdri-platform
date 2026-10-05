import { z } from "zod";

/* ————————————— Contact form ————————————— */

export const contactSchema = z.object({
  name: z.string().trim().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(120),
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(200),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9-()\s]{6,20}$/, "সঠিক ফোন নম্বর দিন")
    .optional()
    .or(z.literal("")),
  subject: z.string().trim().min(3, "বিষয় লিখুন").max(160),
  message: z.string().trim().min(10, "বার্তা কমপক্ষে ১০ অক্ষরের হতে হবে").max(3000),
});
export type ContactInput = z.infer<typeof contactSchema>;

/* ————————————— Newsletter ————————————— */

export const newsletterSchema = z.object({
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(200),
});

/* ————————————— Fatwa question ————————————— */

export const FATWA_CATEGORY_VALUES = ["ibadat", "muamalat", "aqidah", "family", "contemporary"] as const;

export const fatwaQuestionSchema = z.object({
  name: z.string().trim().min(2, "নাম লিখুন").max(120),
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(200),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9-()\s]{6,20}$/, "সঠিক ফোন নম্বর দিন")
    .optional()
    .or(z.literal("")),
  category: z.enum(FATWA_CATEGORY_VALUES),
  question: z.string().trim().min(15, "প্রশ্নটি বিস্তারিত লিখুন (কমপক্ষে ১৫ অক্ষর)").max(4000),
  isPrivate: z.boolean().default(false),
});
export type FatwaQuestionInput = z.infer<typeof fatwaQuestionSchema>;

/* ————————————— Donations ————————————— */

export const FUND_TYPE_VALUES = ["zakat", "general", "scholarship", "sponsor"] as const;
export const CURRENCY_VALUES = ["BDT", "USD", "EUR", "SAR"] as const;

export const donationSchema = z.object({
  fundType: z.enum(FUND_TYPE_VALUES),
  // Optional campaign targeting — resolved to campaignId by the API.
  campaignSlug: z.string().trim().min(1).max(120).optional().or(z.literal("")),
  amount: z
    .number({ message: "সঠিক পরিমাণ লিখুন" })
    .min(10, "সর্বনিম্ন ১০ টাকা")
    .max(10000000, "পরিমাণটি অতিরিক্ত বড়"),
  currency: z.enum(CURRENCY_VALUES).default("BDT"),
  donorName: z.string().trim().min(2, "নাম লিখুন").max(120),
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(200),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9-()\s]{6,20}$/, "সঠিক ফোন নম্বর দিন")
    .optional()
    .or(z.literal("")),
  anonymous: z.boolean().default(false),
  studentRef: z.string().trim().max(40).optional().or(z.literal("")),
  recurring: z.boolean().default(false),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type DonationInput = z.infer<typeof donationSchema>;

/* ————————————— Donations: sandbox payment callback ————————————— */

export const PAYMENT_CALLBACK_STATUS_VALUES = ["COMPLETED", "FAILED"] as const;

/** Signed sandbox-gateway callback body (signature = HMAC-SHA256 over
 *  `${trackingCode}|${status}|${providerTxnId ?? ""}` with the callback secret). */
export const paymentCallbackSchema = z.object({
  trackingCode: z
    .string()
    .trim()
    .regex(/^DN-\d{4}-\d{6}$/, "সঠিক ট্র্যাকিং কোড দিন (যেমন: DN-2026-000001)"),
  status: z.enum(PAYMENT_CALLBACK_STATUS_VALUES),
  providerTxnId: z.string().trim().max(120).optional().or(z.literal("")),
  signature: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{64}$/, "সঠিক স্বাক্ষর (hex) দিন"),
});
export type PaymentCallbackInput = z.infer<typeof paymentCallbackSchema>;

/* ————————————— Auth ————————————— */

export const loginSchema = z.object({
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(200),
  password: z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের").max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "নাম লিখুন").max(120),
    email: z.string().trim().email("সঠিক ইমেইল দিন").max(200),
    phone: z
      .string()
      .trim()
      .regex(/^[+0-9-()\s]{6,20}$/, "সঠিক ফোন নম্বর দিন")
      .optional()
      .or(z.literal("")),
    role: z.enum(["student", "donor", "alumni"]),
    password: z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের").max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "পাসওয়ার্ড দুটি মিলছে না",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

/** Flatten a ZodError into `{ field: message }` for form display. */
export function zodFields(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

/* ————————————— Admin: notice composer ————————————— */

export const NOTICE_CATEGORY_ADMIN_VALUES = ["admission", "recruitment", "academic", "general"] as const;
export const NOTICE_STATUS_ADMIN_VALUES = ["new", "active", "closed"] as const;

export const noticeSchema = z.object({
  titleBn: z.string().trim().min(4, "বাংলা শিরোনাম কমপক্ষে ৪ অক্ষরের").max(220),
  titleEn: z.string().trim().min(4, "English title must be at least 4 characters").max(220),
  excerptBn: z.string().trim().min(10, "বাংলা সারসংক্ষেপ কমপক্ষে ১০ অক্ষরের").max(400),
  excerptEn: z.string().trim().min(10, "English excerpt must be at least 10 characters").max(400),
  bodyBn: z.string().trim().max(6000).optional().or(z.literal("")),
  bodyEn: z.string().trim().max(6000).optional().or(z.literal("")),
  category: z.enum(NOTICE_CATEGORY_ADMIN_VALUES),
  status: z.enum(NOTICE_STATUS_ADMIN_VALUES).default("active"),
  attachmentUrl: z
    .string()
    .trim()
    .url("সঠিক লিংক দিন")
    .max(500)
    .optional()
    .or(z.literal("")),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন দিয়ে গঠিত হতে হবে")
    .max(160)
    .optional()
    .or(z.literal("")),
});
export type NoticeInput = z.infer<typeof noticeSchema>;

export const noticeUpdateSchema = noticeSchema.extend({
  publishedAt: z.string().datetime({ offset: true }).optional(),
});

/* ————————————— Admin: notice pin toggle ————————————— */

export const noticePinSchema = z.object({
  pinned: z.boolean({ message: "পিন স্ট্যাটাস সঠিকভাবে দিন (true/false)" }),
});
export type NoticePinInput = z.infer<typeof noticePinSchema>;

/* ————————————— Admin: fatwa moderation ————————————— */

export const fatwaAnswerSchema = z.object({
  answer: z.string().trim().min(20, "উত্তর কমপক্ষে ২০ অক্ষরের হতে হবে").max(6000),
});
export type FatwaAnswerInput = z.infer<typeof fatwaAnswerSchema>;

/* ————————————— Admin: fatwa → bank promotion ————————————— */

export const fatwaPublishSchema = z.object({
  questionBn: z.string().trim().min(8, "বাংলা প্রশ্ন কমপক্ষে ৮ অক্ষরের হতে হবে").max(1000),
  questionEn: z.string().trim().min(8, "English question must be at least 8 characters").max(1000),
  answerBn: z.string().trim().min(20, "বাংলা উত্তর কমপক্ষে ২০ অক্ষরের হতে হবে").max(6000),
  answerEn: z.string().trim().min(20, "English answer must be at least 20 characters").max(6000),
  answeredBy: z.string().trim().min(3, "উত্তরদাতার নাম কমপক্ষে ৩ অক্ষরের").max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন দিয়ে গঠিত হতে হবে")
    .max(160)
    .optional()
    .or(z.literal("")),
});
export type FatwaPublishInput = z.infer<typeof fatwaPublishSchema>;

/* ————————————— Admin: contact inbox ————————————— */

export const CONTACT_STATUS_ADMIN_VALUES = ["new", "read", "replied"] as const;

export const contactStatusUpdateSchema = z.object({
  status: z.enum(CONTACT_STATUS_ADMIN_VALUES),
});
export type ContactStatusUpdateInput = z.infer<typeof contactStatusUpdateSchema>;

/* ————————————— Admin: campaigns ————————————— */

export const campaignUpdateSchema = z
  .object({
    targetAmount: z.number().min(1, "লক্ষ্য পরিমাণ কমপক্ষে ১ টাকা হতে হবে").max(1e9, "লক্ষ্য পরিমাণটি অতিরিক্ত বড়").optional(),
    raisedAmount: z.number().min(0, "সংগৃহীত পরিমাণ ঋণাত্মক হতে পারবে না").max(1e9, "সংগৃহীত পরিমাণটি অতিরিক্ত বড়").optional(),
    deadline: z.string().datetime("সঠিক তারিখ দিন").nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.targetAmount !== undefined ||
      data.raisedAmount !== undefined ||
      data.deadline !== undefined ||
      data.active !== undefined,
    { message: "অন্তত একটি পরিবর্তনযোগ্য ফিল্ড প্রদান করুন", path: [] },
  );
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;

export const campaignCreateSchema = z.object({
  titleBn: z
    .string({ message: "বাংলা শিরোনাম লিখুন" })
    .trim()
    .min(1, "বাংলা শিরোনাম লিখুন")
    .max(120, "বাংলা শিরোনাম ১২০ অক্ষরের বেশি হতে পারবে না"),
  titleEn: z
    .string({ message: "English title is required" })
    .trim()
    .min(1, "English title is required")
    .max(120, "English title can be at most 120 characters"),
  descriptionBn: z
    .string({ message: "বাংলা বিবরণ লিখুন" })
    .trim()
    .min(1, "বাংলা বিবরণ লিখুন")
    .max(2000, "বাংলা বিবরণ ২০০০ অক্ষরের বেশি হতে পারবে না"),
  descriptionEn: z
    .string({ message: "English description is required" })
    .trim()
    .min(1, "English description is required")
    .max(2000, "English description can be at most 2000 characters"),
  targetAmount: z.number({ message: "সঠিক লক্ষ্য পরিমাণ দিন" }).min(1, "লক্ষ্য পরিমাণ কমপক্ষে ১ টাকা হতে হবে").max(1e9, "লক্ষ্য পরিমাণটি অতিরিক্ত বড়"),
  deadline: z.string().datetime("সঠিক তারিখ দিন").nullable().optional(),
});
export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;

/* ————————————— Admin: donation ledger ————————————— */

export const DONATION_STATUS_ADMIN_VALUES = ["initiated", "completed"] as const;

export const donationStatusSchema = z.object({
  status: z.enum(DONATION_STATUS_ADMIN_VALUES),
});
export type DonationStatusInput = z.infer<typeof donationStatusSchema>;
