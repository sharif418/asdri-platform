/**
 * Shared domain types for the As-Sunnah Dawah & Research Institute website.
 * Every content file and component imports from here — keep names stable.
 */

/** A piece of text available in Bengali (default) and English. */
export interface LocalizedText {
  bn: string;
  en: string;
}

export type Language = "bn" | "en";

/** Pick the string for the active language with graceful fallback. */
export function pick(text: LocalizedText, lang: Language): string {
  return lang === "en" ? text.en || text.bn : text.bn || text.en;
}

/* ————————————————— Notices ————————————————— */

export const NOTICE_CATEGORIES = ["admission", "recruitment", "academic", "general"] as const;
export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];

export const NOTICE_STATUSES = ["new", "active", "closed"] as const;
export type NoticeStatus = (typeof NOTICE_STATUSES)[number];

export interface NoticeItem {
  id: string;
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  category: NoticeCategory;
  status: NoticeStatus;
  attachmentUrl: string | null;
  publishedAt: string; // ISO date
}

/* ————————————————— Courses ————————————————— */

export type CourseKind = "flagship" | "certificate" | "diploma" | "training";

export interface CourseModule {
  name: LocalizedText;
}

export interface CurriculumCourse {
  code: string;
  title: LocalizedText;
  modules: CourseModule[];
  credits: number;
  marks: number;
}

export interface CurriculumSemester {
  label: LocalizedText;
  note: LocalizedText | null;
  totalCredits: number;
  totalMarks: number;
  courses: CurriculumCourse[];
}

export interface CourseDetails {
  intro: LocalizedText;
  objectives: LocalizedText[];
  kind: LocalizedText;
  duration: LocalizedText;
  accommodation: LocalizedText;
  eligibility: LocalizedText[];
  curriculum: CurriculumSemester[];
  extraSections: { title: LocalizedText; body: LocalizedText[] }[];
  outcomes: LocalizedText[];
}

export interface Course {
  slug: string;
  titleBn: string;
  titleEn: string;
  titleAr?: string;
  kind: CourseKind;
  tagline: LocalizedText;
  summary: LocalizedText;
  durationLabel: LocalizedText;
  eligibilityLabel: LocalizedText;
  featured: boolean;
  icon: string; // lucide icon key, mapped in components
  accentClass: string; // tailwind gradient classes
  details: CourseDetails;
  /** DB-driven extras (optional so legacy static content keeps type-checking) */
  code?: string;
  coverUrl?: string;
  sdp?: SdpItem[];
  specializations?: { bn: string; en: string; ar?: string }[];
}

export interface SdpItem {
  id?: string;
  title: LocalizedText;
  objective: LocalizedText;
  activities: LocalizedText;
  hours: number;
  outcome: LocalizedText;
}

/* ————————————————— Faculty ————————————————— */

export interface LeadershipMember {
  id: string;
  name: LocalizedText;
  role: LocalizedText;
  bio: LocalizedText | null;
  initials: string;
}

export interface FacultyMember {
  id: string;
  name: LocalizedText;
  designation: LocalizedText;
  subjects: LocalizedText[];
  category: "leadership" | "teacher" | "language" | "tajweed" | "coordination";
}

export interface FacultyGroup {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText | null;
  members: FacultyMember[];
}

/* ————————————————— Stats ————————————————— */

export interface StatItem {
  id: string;
  value: number;
  suffix: "+" | "";
  label: LocalizedText;
  icon: "students" | "scholar" | "general" | "shortcourse" | "enrolled" | "alumni";
}

/* ————————————————— Fatwa ————————————————— */

export const FATWA_CATEGORIES = ["ibadat", "muamalat", "aqidah", "family", "contemporary"] as const;
export type FatwaCategory = (typeof FATWA_CATEGORIES)[number];

export interface FatwaEntry {
  id: string;
  slug: string;
  category: FatwaCategory;
  question: LocalizedText;
  answer: LocalizedText;
  answeredBy: string;
  publishedAt: string;
}

/* ————————————————— Donations ————————————————— */

export const FUND_TYPES = ["zakat", "general", "scholarship", "sponsor"] as const;
export type FundType = (typeof FUND_TYPES)[number];

export interface FundingCampaign {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  targetAmount: number;
  raisedAmount: number;
  currency: "BDT";
  deadline: string | null;
  active: boolean;
}

export interface SponsorStudent {
  id: string; // e.g. AS-104
  classYear: LocalizedText;
  district: LocalizedText;
  needLevel: "high" | "medium";
  monthlyCost: number;
}

/* ————————————————— Media ————————————————— */

export interface BlogArticle {
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  category: LocalizedText;
  author: string;
  authorRole: LocalizedText;
  publishedAt: string;
  readMinutes: number;
  cover: string;
  contentBn: string; // markdown (Bengali primary)
  contentEn?: string;
}

export interface VideoItem {
  id: string;
  title: LocalizedText;
  playlist: LocalizedText;
  duration: string;
  thumbnail: string;
  /** YouTube deep-link (search URL or direct watch URL). */
  youtubeUrl: string;
}

export interface GalleryPhoto {
  src: string;
  alt: LocalizedText;
  caption: LocalizedText;
  album: LocalizedText;
}

export interface NewsItem {
  id: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  date: string;
  location: LocalizedText | null;
  cover: string;
  body: LocalizedText[];
  upcoming: boolean;
}

/* ————————————————— FAQ ————————————————— */

export interface FaqItem {
  question: LocalizedText;
  answer: LocalizedText;
}

export interface FaqGroup {
  id: string;
  title: LocalizedText;
  items: FaqItem[];
}

/* ————————————————— Research ————————————————— */

export interface ResearchProject {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  progress: number; // 0-100
  status: "ongoing" | "upcoming";
  team: LocalizedText | null;
}

export interface PublicationItem {
  id: string;
  title: LocalizedText;
  author: string;
  authorRole: LocalizedText;
  type: "journal" | "book" | "paper";
  year: number;
  description: LocalizedText;
  issnIsbn: string | null;
  accentClass: string; // tailwind gradient for the CSS-designed cover
}

export interface ClarificationTopic {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  articleCount: number;
  videoCount: number;
  icon: string;
}

/* ————————————————— Download center ————————————————— */

export interface DownloadItem {
  id: string;
  title: LocalizedText;
  category: "syllabus" | "form" | "dawah" | "prospectus";
  fileType: "PDF" | "DOC" | "ZIP";
  sizeLabel: string;
  /** null while the office has not attached a file (renders "coming soon"). */
  url: string | null;
}

/* ————————————————— Admission ————————————————— */

export interface AdmissionStep {
  step: number;
  title: LocalizedText;
  description: LocalizedText;
}

/* ————————————————— API payloads ————————————————— */

export interface ApiError {
  error: string;
  code: "VALIDATION" | "RATE_LIMIT" | "SERVER" | "NOT_FOUND" | "UNAUTHORIZED";
  fields?: Record<string, string>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
