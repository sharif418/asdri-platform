import type { FatwaCategory, Language } from "@/types";

/** Fatwa category labels shared across the bank explorer and ask form. */
export const fatwaCategoryOptions: {
  value: FatwaCategory;
  labelBn: string;
  labelEn: string;
}[] = [
  { value: "ibadat", labelBn: "ইবাদত", labelEn: "Worship" },
  { value: "muamalat", labelBn: "লেনদেন", labelEn: "Transactions" },
  { value: "aqidah", labelBn: "আকীদা", labelEn: "Creed" },
  { value: "family", labelBn: "পারিবারিক", labelEn: "Family" },
  { value: "contemporary", labelBn: "সমকালীন", labelEn: "Contemporary" },
];

/** Resolve a category's display label for the active language. */
export function fatwaCategoryLabel(category: FatwaCategory, lang: Language): string {
  const found = fatwaCategoryOptions.find((option) => option.value === category);
  if (!found) return category;
  return lang === "bn" ? found.labelBn : found.labelEn;
}

/** Wire format of a single fatwa entry returned by GET /api/fatwa. */
export interface FatwaDto {
  id: string;
  slug: string;
  category: FatwaCategory;
  question: { bn: string; en: string };
  answer: { bn: string; en: string };
  answeredBy: string;
  publishedAt: string;
}

/** Envelope of GET /api/fatwa. */
export interface FatwaListResponse {
  data: {
    items: FatwaDto[];
    total: number;
    page: number;
    pageSize: number;
  };
}
