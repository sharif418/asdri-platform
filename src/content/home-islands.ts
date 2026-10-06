import type { FatwaCategory, NoticeCategory } from "@/types";

/**
 * Neutral (client- and server-importable) constants for the homepage
 * interactive islands. They must NOT live in a "use client" module (server
 * components can't read plain values across that boundary) nor in a
 * db-importing server lib (client components must not pull Prisma into
 * their graph) — this file imports nothing but types.
 */

export type FeedTab = "all" | NoticeCategory;

/** The tabs the home feed offers (general notices appear under "all" only). */
export type OfferedTab = "all" | "admission" | "academic" | "recruitment";

export const feedTabs: { id: OfferedTab; key: string }[] = [
  { id: "all", key: "label.all" },
  { id: "admission", key: "notice.cat.admission" },
  { id: "academic", key: "notice.cat.academic" },
  { id: "recruitment", key: "notice.cat.recruitment" },
];

/** Category labels shared by the fatwa ask-form island and the server-rendered bank. */
export const fatwaCategoryOptions: { value: FatwaCategory; labelBn: string; labelEn: string }[] = [
  { value: "ibadat", labelBn: "ইবাদত", labelEn: "Worship" },
  { value: "muamalat", labelBn: "লেনদেন", labelEn: "Transactions" },
  { value: "aqidah", labelBn: "আকীদা", labelEn: "Creed" },
  { value: "family", labelBn: "পারিবারিক", labelEn: "Family" },
  { value: "contemporary", labelBn: "সমকালীন", labelEn: "Contemporary" },
];
