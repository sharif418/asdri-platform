import {
  Bell,
  BookOpen,
  Compass,
  FileText,
  GraduationCap,
  Images,
  Lightbulb,
  MessageCircleQuestion,
  Newspaper,
  User,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { SearchEntryType } from "@/lib/search-index";

/** Icon per search result type (direct map — reference lookup, not a factory). */
export const RESULT_ICONS: Record<SearchEntryType, LucideIcon> = {
  page: Compass,
  course: GraduationCap,
  article: BookOpen,
  topic: Lightbulb,
  notice: Bell,
  fatwa: MessageCircleQuestion,
  action: Zap,
  news: Newspaper,
  person: User,
  album: Images,
};

/** Medallion tone per search result type. */
export const RESULT_TONES: Record<SearchEntryType, string> = {
  page: "bg-secondary text-secondary-foreground",
  course: "bg-emerald-deep text-ivory",
  article: "bg-parchment text-emerald-950 dark:bg-secondary dark:text-ivory",
  topic: "bg-gold-soft text-gold-foreground dark:text-accent-foreground",
  notice: "bg-gold-soft text-gold-foreground dark:text-accent-foreground",
  fatwa: "bg-emerald-deep text-ivory",
  action: "bg-gold-gradient text-gold-foreground",
  news: "bg-parchment text-emerald-950 dark:bg-secondary dark:text-ivory",
  person: "bg-emerald-deep text-ivory",
  album: "bg-gold-soft text-gold-foreground dark:text-accent-foreground",
};

/** Fallback icon for unknown result types. */
export const RESULT_ICON_FALLBACK: LucideIcon = FileText;
