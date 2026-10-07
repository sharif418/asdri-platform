import type { LibraryItemType } from "@prisma/client";
import { langPath } from "@/lib/locale";
import { formatNumber } from "@/lib/format";
import { pick, type Language, type LocalizedText } from "@/types";
import type { LibraryCreatorView } from "@/lib/content/library";

/**
 * Pure helpers shared by the public library pages (catalogue, record,
 * reader chrome): bilingual labels, URL building for the GET-form filters,
 * and the creator line the cards print. No database import — safe for both
 * server and client components.
 */

export const LIBRARY_TYPE_LABELS: Record<LibraryItemType, LocalizedText> = {
  BOOK: { bn: "বই", en: "Book" },
  JOURNAL_ISSUE: { bn: "জার্নাল", en: "Journal" },
  PAPER: { bn: "গবেষণাপত্র", en: "Research paper" },
  DIGITAL_FILE: { bn: "ডিজিটাল ফাইল", en: "Digital file" },
};

/** The catalogue's type filter — সব first, then the four shelf types. */
export const LIBRARY_TYPE_FILTERS: { value: string; label: LocalizedText }[] = [
  { value: "", label: { bn: "সব", en: "All" } },
  { value: "BOOK", label: LIBRARY_TYPE_LABELS.BOOK },
  { value: "JOURNAL_ISSUE", label: LIBRARY_TYPE_LABELS.JOURNAL_ISSUE },
  { value: "PAPER", label: LIBRARY_TYPE_LABELS.PAPER },
  { value: "DIGITAL_FILE", label: LIBRARY_TYPE_LABELS.DIGITAL_FILE },
];

export const LIBRARY_ROLE_LABELS: Record<
  LibraryCreatorView["role"],
  LocalizedText
> = {
  AUTHOR: { bn: "লেখক", en: "Author" },
  EDITOR: { bn: "সম্পাদক", en: "Editor" },
  TRANSLATOR: { bn: "অনুবাদক", en: "Translator" },
};

export const LIBRARY_LANGUAGE_LABELS: Record<string, LocalizedText> = {
  bn: { bn: "বাংলা", en: "Bengali" },
  en: { bn: "ইংরেজি", en: "English" },
  ar: { bn: "আরবি", en: "Arabic" },
  mixed: { bn: "দ্বিভাষিক", en: "Bilingual" },
};

/** MEMBERS items are listed to everyone — this is the badge that says so. */
export const LIBRARY_MEMBERS_LABEL: LocalizedText = {
  bn: "সদস্যদের জন্য",
  en: "Members only",
};

export function libraryLanguageLabel(code: string): LocalizedText {
  return LIBRARY_LANGUAGE_LABELS[code] ?? { bn: code, en: code };
}

/** Public record page for an item (both languages share one slug). */
export function libraryItemHref(lang: Language, slug: string): string {
  return langPath(lang, `/research/library/${slug}`);
}

/** Reader route for an item. */
export function libraryReaderHref(lang: Language, slug: string): string {
  return langPath(lang, `/research/library/${slug}/read`);
}

export interface LibraryUrlParams {
  q?: string;
  type?: string;
  category?: string;
  year?: string | number;
  language?: string;
  journalKey?: string;
  page?: number;
}

/** Catalogue URL with only the truthy filters kept (page 1 stays implicit). */
export function buildLibraryUrl(
  lang: Language,
  params: LibraryUrlParams,
): string {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.type) search.set("type", params.type);
  if (params.category) search.set("category", params.category);
  if (params.year !== undefined && params.year !== "" && params.year !== null)
    search.set("year", String(params.year));
  if (params.language) search.set("language", params.language);
  if (params.journalKey) search.set("journal", params.journalKey);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return langPath(lang, qs ? `/research/library?${qs}` : "/research/library");
}

/**
 * Creator line for cards: first two names, then "ও আরও ২ জন" / "& 2 more"
 * (et al. beyond two, the journal-card convention).
 */
export function libraryCreatorLine(
  creators: LibraryCreatorView[],
  lang: Language,
): string {
  const names = creators.map((creator) => pick(creator.name, lang));
  if (names.length === 0) return "";
  if (names.length <= 2) return names.join(lang === "bn" ? " ও " : " & ");
  const rest = names.length - 2;
  return `${names.slice(0, 2).join(", ")} ${lang === "bn" ? `ও আরও ${formatNumber(rest, lang)} জন` : `& ${formatNumber(rest, lang)} more`}`;
}

/** Full creator line for the record page — every name, no elision. */
export function libraryCreatorFullLine(
  creators: LibraryCreatorView[],
  lang: Language,
): string {
  const names = creators.map((creator) => pick(creator.name, lang));
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")}${lang === "bn" ? " ও " : " & "}${names[names.length - 1]}`;
}
