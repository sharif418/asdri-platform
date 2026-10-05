import type { AppDocType, ApplicationStatus, IntakeStatus } from "@prisma/client";

/**
 * Bangla-first label maps + status-chip styling shared by the admissions
 * admin pages (module home, intakes manager, applications workflow, detail)
 * and kept free of React imports so server pages can use it directly.
 */

export const APPLICATION_STATUS_META: Record<ApplicationStatus, { label: string; chip: string }> = {
  DRAFT: { label: "খসড়া", chip: "bg-muted text-muted-foreground" },
  SUBMITTED: { label: "জমা হয়েছে", chip: "bg-gold/15 text-gold" },
  UNDER_REVIEW: { label: "যাচাই চলছে", chip: "bg-primary/10 text-primary" },
  SHORTLISTED: { label: "প্রাথমিক বাছাই", chip: "bg-gold/15 text-gold" },
  EXAM_SCHEDULED: { label: "পরীক্ষার তারিখ নির্ধারিত", chip: "bg-primary/10 text-primary" },
  EXAM_TAKEN: { label: "পরীক্ষা সম্পন্ন", chip: "bg-primary/10 text-primary" },
  INTERVIEW: { label: "মৌখিক পরীক্ষা", chip: "bg-primary/10 text-primary" },
  ADMITTED: { label: "ভর্তি নিশ্চিত", chip: "bg-primary text-primary-foreground" },
  WAITLISTED: { label: "অপেক্ষমাণ তালিকা", chip: "bg-gold/15 text-gold" },
  REJECTED: { label: "নির্বাচিত হননি", chip: "bg-muted text-muted-foreground" },
};

/** The officer status machine the PATCH API accepts (SUBMITTED/DRAFT are applicant-side). */
export const OFFICER_STATUSES: ApplicationStatus[] = [
  "UNDER_REVIEW",
  "SHORTLISTED",
  "EXAM_SCHEDULED",
  "EXAM_TAKEN",
  "INTERVIEW",
  "ADMITTED",
  "WAITLISTED",
  "REJECTED",
];

export const INTAKE_STATUS_META: Record<IntakeStatus, { label: string; chip: string }> = {
  UPCOMING: { label: "আসন্ন", chip: "bg-gold/15 text-gold" },
  OPEN: { label: "খোলা", chip: "bg-primary/10 text-primary" },
  CLOSED: { label: "বন্ধ", chip: "bg-muted text-muted-foreground" },
  PROCESSING: { label: "প্রক্রিয়াধীন", chip: "bg-primary text-primary-foreground" },
};

export const APP_DOC_TYPE_LABELS: Record<AppDocType, string> = {
  PHOTO: "পাসপোর্ট ছবি",
  NID: "জাতীয় পরিচয়পত্র",
  TRANSCRIPT: "মার্কশিট",
  CERTIFICATE: "সনদপত্র",
  CHARACTER: "চারিত্রিক সনদ",
  OTHER: "অন্যান্য",
};

export const GENDER_LABELS: Record<string, string> = {
  male: "পুরুষ",
  female: "মহিলা",
};

/** Chip for an application status (falls back to the raw enum for safety). */
export function applicationStatusChip(status: ApplicationStatus): string {
  return `rounded-full px-2 py-0.5 text-[10.5px] font-bold ${APPLICATION_STATUS_META[status]?.chip ?? "bg-muted text-muted-foreground"}`;
}

export function applicationStatusLabel(status: ApplicationStatus): string {
  return APPLICATION_STATUS_META[status]?.label ?? status;
}

export function intakeStatusChip(status: IntakeStatus): string {
  return `rounded-full px-2 py-0.5 text-[10.5px] font-bold ${INTAKE_STATUS_META[status]?.chip ?? "bg-muted text-muted-foreground"}`;
}

export function intakeStatusLabel(status: IntakeStatus): string {
  return INTAKE_STATUS_META[status]?.label ?? status;
}
