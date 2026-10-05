import { z } from "zod";

/**
 * Admin validators — media library, users, inbox messages. Bangla error copy.
 */

/* ————————— Media ————————— */

export const mediaAltUpdateSchema = z.object({
  altBn: z.string().trim().max(300, "বিকল্প টেক্সট (বাংলা) ৩০০ অক্ষরের মধ্যে দিন").optional(),
  altEn: z.string().trim().max(300, "Alt text (English) must be ≤ 300 chars").optional(),
});
export type MediaAltUpdateInput = z.infer<typeof mediaAltUpdateSchema>;

/** Query params for the picker/library listing API. */
export const mediaListQuerySchema = z.object({
  kind: z.enum(["IMAGE", "DOCUMENT"]).optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
});
export type MediaListQueryInput = z.infer<typeof mediaListQuerySchema>;

/* ————————— Users ————————— */

export const userRoleSchema = z.enum(["ADMIN", "EDITOR", "ADMISSIONS", "FINANCE", "FATWA"]);

export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(150),
  email: z.string().trim().toLowerCase().email("সঠিক ইমেইল দিন").max(200),
  role: userRoleSchema,
});
export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z
  .object({
    role: userRoleSchema.optional(),
    isActive: z.boolean().optional(),
    name: z.string().trim().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(150).optional(),
  })
  .refine((data) => data.role !== undefined || data.isActive !== undefined || data.name !== undefined, {
    message: "পরিবর্তনের কিছু নেই",
  });
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

/* ————————— Inbox messages ————————— */

export const messageUpdateSchema = z.object({
  isRead: z.boolean({ message: "পঠিত স্ট্যাটাস সঠিকভাবে দিন (true/false)" }),
});
export type MessageUpdateInput = z.infer<typeof messageUpdateSchema>;

/* ————————— Audit log filters ————————— */

export const auditFilterSchema = z.object({
  entity: z.string().trim().max(60).optional(),
  action: z.string().trim().max(60).optional(),
  actorId: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).max(5000).optional(),
});
export type AuditFilterInput = z.infer<typeof auditFilterSchema>;
