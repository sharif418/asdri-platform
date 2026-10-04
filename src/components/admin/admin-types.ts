import type { FatwaCategory, Language, NoticeCategory, NoticeStatus } from "@/types";

/* ————————— Wire types (serialized, safe to pass from server → client) ————————— */

/** Serialized notice row for the admin management table. */
export interface AdminNoticeData {
  id: string;
  slug: string;
  titleBn: string;
  titleEn: string;
  category: NoticeCategory;
  status: NoticeStatus;
  pinned: boolean;
  publishedAt: string;
  updatedAt: string;
}

/** Full serialized notice used by the edit page (includes body fields). */
export interface AdminNoticeDetail extends AdminNoticeData {
  excerptBn: string;
  excerptEn: string;
  bodyBn: string;
  bodyEn: string;
  attachmentUrl: string | null;
  createdAt: string;
}

/** Serialized fatwa question for the moderation queue. */
export interface AdminFatwaQuestionData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  category: FatwaCategory;
  question: string;
  isPrivate: boolean;
  status: "pending" | "answered" | "published";
  answer: string | null;
  answeredAt: string | null;
  publishedSlug: string | null;
  createdAt: string;
}

/** Serialized contact-form message for the admin inbox. */
export interface AdminContactMessageData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: string;
}

/** Serialized admin action row for the audit timeline. */
export interface AdminAuditEntryData {
  id: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entityRef: string;
  summaryBn: string;
  createdAt: string;
}

/** Per-campaign donation aggregates for the campaign board. */
export interface AdminCampaignStats {
  completedCount: number;
  completedSum: number;
  totalCount: number;
}

/** Serialized funding-campaign row for the admin campaign board. */
export interface AdminCampaignData {
  id: string;
  slug: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  targetAmount: number;
  raisedAmount: number;
  currency: string;
  deadline: string | null;
  active: boolean;
  createdAt: string;
  stats: AdminCampaignStats;
}

/** Form values shared by the create + edit notice composer. */
export interface NoticeFormValues {
  titleBn: string;
  titleEn: string;
  excerptBn: string;
  excerptEn: string;
  bodyBn: string;
  bodyEn: string;
  category: NoticeCategory;
  status: NoticeStatus;
  attachmentUrl: string;
  slug: string;
}

/* ————————— Labels (admin context — Bengali first) ————————— */

export const ADMIN_NOTICE_CATEGORY_LABELS: Record<NoticeCategory, { bn: string; en: string }> = {
  admission: { bn: "ভর্তি", en: "Admission" },
  recruitment: { bn: "নিয়োগ", en: "Recruitment" },
  academic: { bn: "একাডেমিক", en: "Academic" },
  general: { bn: "সাধারণ", en: "General" },
};

export function adminCategoryLabel(category: NoticeCategory, lang: Language): string {
  const label = ADMIN_NOTICE_CATEGORY_LABELS[category];
  return lang === "bn" ? label.bn : label.en;
}

/** Admin-facing status labels: নতুন / সক্রিয় / বন্ধ. */
export function adminStatusLabel(status: NoticeStatus, lang: Language): string {
  if (status === "new") return lang === "bn" ? "নতুন" : "New";
  if (status === "active") return lang === "bn" ? "সক্রিয়" : "Active";
  return lang === "bn" ? "বন্ধ" : "Closed";
}

/** new = gold, active = emerald, closed = neutral. */
export function adminStatusBadgeClass(status: NoticeStatus): string {
  switch (status) {
    case "new":
      return "border-gold/40 bg-gold/15 text-gold";
    case "active":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    case "closed":
      return "border-border bg-muted text-muted-foreground";
  }
}

/** Admin-facing pinned label: পিন করা / Pinned. */
export function adminPinnedLabel(lang: Language): string {
  return lang === "bn" ? "পিন করা" : "Pinned";
}

/** Fatwa moderation status labels. */
export function adminFatwaStatusLabel(status: "pending" | "answered" | "published", lang: Language): string {
  if (status === "pending") return lang === "bn" ? "অপেক্ষমাণ" : "Pending";
  if (status === "answered") return lang === "bn" ? "উত্তরপ্রাপ্ত" : "Answered";
  return lang === "bn" ? "প্রকাশিত" : "Published";
}

export function adminFatwaStatusBadgeClass(status: "pending" | "answered" | "published"): string {
  if (status === "pending") return "border-gold/40 bg-gold/15 text-gold";
  if (status === "answered") return "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  return "border-primary/40 bg-primary/10 text-primary dark:text-gold";
}

/** Contact inbox status labels: নতুন / পঠিত / উত্তরপ্রাপ্ত. */
export function adminContactStatusLabel(status: "new" | "read" | "replied", lang: Language): string {
  if (status === "new") return lang === "bn" ? "নতুন" : "New";
  if (status === "read") return lang === "bn" ? "পঠিত" : "Read";
  return lang === "bn" ? "উত্তরপ্রাপ্ত" : "Replied";
}

export function adminContactStatusBadgeClass(status: "new" | "read" | "replied"): string {
  if (status === "new") return "border-gold/40 bg-gold/15 text-gold";
  if (status === "read") return "border-primary/30 bg-primary/10 text-primary dark:text-gold";
  return "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
}
