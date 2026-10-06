import type { Language, NoticeCategory, NoticeStatus } from "@/types";

/**
 * Pure notice label/badge helpers — shared by the server-rendered detail
 * page and the client dialog/cards. Lives outside the "use client" dialog
 * module so server components can call these directly.
 */

export function statusLabel(status: NoticeStatus, lang: Language): string {
  if (status === "new") return lang === "bn" ? "নতুন" : "New";
  if (status === "active") return lang === "bn" ? "আবেদন চলছে" : "Ongoing";
  return lang === "bn" ? "শেষ" : "Closed";
}

export function statusBadgeClass(status: NoticeStatus): string {
  switch (status) {
    case "new":
      return "border-gold/40 bg-gold/15 text-gold";
    case "active":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    case "closed":
      return "border-border bg-muted text-muted-foreground";
  }
}

export function categoryLabel(category: NoticeCategory, lang: Language): string {
  const map: Record<NoticeCategory, { bn: string; en: string }> = {
    admission: { bn: "ভর্তি", en: "Admission" },
    recruitment: { bn: "নিয়োগ", en: "Recruitment" },
    academic: { bn: "একাডেমিক", en: "Academic" },
    general: { bn: "সাধারণ", en: "General" },
  };
  return lang === "bn" ? map[category].bn : map[category].en;
}
